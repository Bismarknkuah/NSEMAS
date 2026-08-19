const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const books = collection('library_books');
const loans = collection('library_loans');
const invoices = collection('invoices'); // shared with finance.js — a book purchase is just another invoice
const schools = collection('schools');
const students = collection('students');

const LIBRARY_STAFF_ROLES = ['LIBRARIAN', 'HEADMASTER', 'PROPRIETOR', 'ASSISTANT_HEAD_ACADEMIC', 'SCHOOL_ADMIN'];
const LOAN_PERIOD_DAYS = 14;

function isLibraryStaff(user) { return LIBRARY_STAFF_ROLES.includes(user.role); }

function bookWithAvailability(book) {
  const activeLoans = loans.find((l) => l.bookId === book.id && l.status === 'BORROWED').length;
  return { ...book, availableCopies: Math.max(0, book.totalCopies - activeLoans) };
}

router.post('/books', authenticate, (req, res) => {
  if (!isLibraryStaff(req.user)) return res.status(403).json({ error: 'Only library staff can add books' });
  const { title, author, isbn, category, totalCopies, price, schoolId } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'title and author are required' });
  const targetSchoolId = schoolId || req.user.scope?.schoolId;
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!targetSchoolId || !allowedIds.has(targetSchoolId)) return res.status(403).json({ error: 'No access to this school' });

  const record = {
    id: uuid(), schoolId: targetSchoolId, title, author, isbn: isbn || null,
    category: category || 'General', totalCopies: totalCopies ? Number(totalCopies) : 1,
    price: price ? Number(price) : null,
    addedBy: req.user.name, addedAt: new Date().toISOString(),
  };
  books.insert(record);
  res.status(201).json(bookWithAvailability(record));
});

router.get('/books', authenticate, (req, res) => {
  const { schoolId, search, category } = req.query;
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  let list = books.all().filter((b) => allowedIds.has(b.schoolId));
  if (schoolId) list = list.filter((b) => b.schoolId === schoolId);
  if (category) list = list.filter((b) => b.category === category);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }
  res.json(list.map(bookWithAvailability));
});

router.delete('/books/:id', authenticate, (req, res) => {
  if (!isLibraryStaff(req.user)) return res.status(403).json({ error: 'Only library staff can remove books' });
  const book = books.findById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (loans.findOne((l) => l.bookId === book.id && l.status === 'BORROWED')) {
    return res.status(409).json({ error: 'Cannot remove — copies are currently on loan' });
  }
  books.deleteById(book.id);
  res.json({ deleted: true });
});

router.post('/books/:id/borrow', authenticate, (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can borrow' });
  const book = books.findById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  const studentId = req.user.scope?.studentId;
  if (!studentId) return res.status(400).json({ error: 'No student record linked to this account' });

  const available = bookWithAvailability(book).availableCopies;
  if (available <= 0) return res.status(409).json({ error: 'No copies currently available' });
  if (loans.findOne((l) => l.bookId === book.id && l.studentId === studentId && l.status === 'BORROWED')) {
    return res.status(409).json({ error: 'You already have this book on loan' });
  }

  const now = new Date();
  const due = new Date(now.getTime() + LOAN_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const record = {
    id: uuid(), bookId: book.id, studentId, schoolId: book.schoolId,
    borrowedAt: now.toISOString(), dueDate: due.toISOString().slice(0, 10),
    returnedAt: null, status: 'BORROWED',
  };
  loans.insert(record);
  res.status(201).json(record);
});

router.post('/loans/:id/return', authenticate, (req, res) => {
  if (!isLibraryStaff(req.user)) return res.status(403).json({ error: 'Only library staff can process returns' });
  const loan = loans.findById(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  if (loan.status !== 'BORROWED') return res.status(409).json({ error: 'This loan is already closed' });
  const updated = loans.updateById(loan.id, { status: 'RETURNED', returnedAt: new Date().toISOString() });
  res.json(updated);
});

router.get('/my-loans', authenticate, (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Students only' });
  const studentId = req.user.scope?.studentId;
  const mine = loans.find((l) => l.studentId === studentId).map((l) => {
    const book = books.findById(l.bookId);
    const overdue = l.status === 'BORROWED' && l.dueDate < new Date().toISOString().slice(0, 10);
    return { ...l, bookTitle: book?.title || 'Unknown', bookAuthor: book?.author || '', overdue };
  });
  res.json(mine.sort((a, b) => (a.borrowedAt < b.borrowedAt ? 1 : -1)));
});

router.get('/loans', authenticate, (req, res) => {
  if (!isLibraryStaff(req.user)) return res.status(403).json({ error: 'Only library staff can view all loans' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const list = loans.all().filter((l) => allowedIds.has(l.schoolId)).map((l) => {
    const book = books.findById(l.bookId);
    const student = students.findById(l.studentId);
    const overdue = l.status === 'BORROWED' && l.dueDate < new Date().toISOString().slice(0, 10);
    return { ...l, bookTitle: book?.title || 'Unknown', studentName: student?.name || 'Unknown', overdue };
  });
  res.json(list.sort((a, b) => (a.borrowedAt < b.borrowedAt ? 1 : -1)));
});

router.post('/books/:id/purchase-request', authenticate, (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ error: 'Only students can request a purchase' });
  const book = books.findById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (!book.price) return res.status(400).json({ error: 'This book has no price set — ask the librarian to add one' });
  const school = schools.findById(book.schoolId);
  if (school?.type !== 'PRIVATE') return res.status(400).json({ error: 'Book purchases are only available at private schools — public schools operate under free universal basic education' });

  const studentId = req.user.scope?.studentId;
  const invoice = {
    id: uuid(), studentId, schoolId: book.schoolId, feeStructureId: null,
    description: `Book purchase: ${book.title}`, amount: book.price, term: null, academicYear: null,
    dueDate: null, createdBy: req.user.name, createdAt: new Date().toISOString(),
  };
  invoices.insert(invoice);
  res.status(201).json({ invoiceCreated: true, invoice });
});

module.exports = router;
