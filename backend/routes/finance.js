const express = require('express');
const { v4: uuid } = require('uuid');
const { collection } = require('../db');
const { authenticate, requireFlag } = require('../middleware/auth');
const { schoolIdsForUser } = require('../utils/scope');

const router = express.Router();
const feeStructures = collection('fee_structures');
const invoices = collection('invoices');
const payments = collection('payments');
const students = collection('students');
const schools = collection('schools');
const users = collection('users');
const parentLinks = collection('parent_links');

/**
 * Private-school finance
 * -----------------------
 * Public schools operate under Ghana's Free Compulsory Universal Basic
 * Education policy — no fees to bill. This module is deliberately scoped
 * to private schools, which do charge fees: a Headmaster/Proprietor (or
 * Accountant/School Admin/Executive Director) defines fee structures per
 * term, generates invoices for a class in one action, and records
 * payments (which can be partial — a balance is a real running total,
 * not a paid/unpaid toggle). Every invoice and payment surfaces on both
 * the student's and the parent's own dashboard automatically.
 */

function requirePrivateSchool(schoolId, res) {
  const school = schools.findById(schoolId);
  if (!school) { res.status(404).json({ error: 'School not found' }); return null; }
  if (school.type !== 'PRIVATE') {
    res.status(400).json({ error: 'Fee billing is only available for private schools — public schools operate under free universal basic education' });
    return null;
  }
  return school;
}

function invoiceWithBalance(invoice) {
  const paid = payments.find((p) => p.invoiceId === invoice.id).reduce((sum, p) => sum + p.amount, 0);
  const balance = invoice.amount - paid;
  return {
    ...invoice,
    paidAmount: paid,
    balance,
    status: balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
    overdue: balance > 0 && invoice.dueDate && invoice.dueDate < new Date().toISOString().slice(0, 10),
  };
}

router.post('/fee-structures', authenticate, requireFlag('canManageFinance'), (req, res) => {
  const { schoolId, name, amount, term, academicYear, class: klass } = req.body;
  if (!schoolId || !name || !amount) return res.status(400).json({ error: 'schoolId, name and amount are required' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(schoolId)) return res.status(403).json({ error: 'No access to this school' });
  if (!requirePrivateSchool(schoolId, res)) return;

  const record = {
    id: uuid(), schoolId, name, amount: Number(amount),
    term: term || 1,
    academicYear: academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    class: klass || 'ALL',
    createdBy: req.user.name,
    createdAt: new Date().toISOString(),
  };
  feeStructures.insert(record);
  res.status(201).json(record);
});

router.get('/fee-structures', authenticate, (req, res) => {
  const { schoolId } = req.query;
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  let list = feeStructures.all().filter((f) => allowedIds.has(f.schoolId));
  if (schoolId) list = list.filter((f) => f.schoolId === schoolId);
  res.json(list);
});

// One action to bill an entire class (or the whole school) for a term —
// the whole point of "advanced" here versus billing student by student.
router.post('/fee-structures/:id/generate-invoices', authenticate, requireFlag('canManageFinance'), (req, res) => {
  const fee = feeStructures.findById(req.params.id);
  if (!fee) return res.status(404).json({ error: 'Fee structure not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(fee.schoolId)) return res.status(403).json({ error: 'No access to this school' });

  let roll = students.find((s) => s.schoolId === fee.schoolId && s.status === 'ACTIVE');
  if (fee.class !== 'ALL') roll = roll.filter((s) => s.class === fee.class);

  const created = [];
  const skipped = [];
  for (const student of roll) {
    const already = invoices.findOne((i) => i.studentId === student.id && i.feeStructureId === fee.id);
    if (already) { skipped.push(student.name); continue; }
    const invoice = {
      id: uuid(), studentId: student.id, schoolId: fee.schoolId, feeStructureId: fee.id,
      description: fee.name, amount: fee.amount, term: fee.term, academicYear: fee.academicYear,
      dueDate: req.body.dueDate || null,
      createdBy: req.user.name, createdAt: new Date().toISOString(),
    };
    invoices.insert(invoice);
    created.push(invoice);
  }
  res.status(201).json({ createdCount: created.length, skippedCount: skipped.length, skipped });
});

router.post('/invoices', authenticate, requireFlag('canManageFinance'), (req, res) => {
  const { studentId, schoolId, description, amount, term, academicYear, dueDate } = req.body;
  if (!studentId || !description || !amount) return res.status(400).json({ error: 'studentId, description and amount are required' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  const student = students.findById(studentId);
  if (!student || !allowedIds.has(student.schoolId)) return res.status(403).json({ error: 'No access to this student' });
  if (!requirePrivateSchool(student.schoolId, res)) return;

  const record = {
    id: uuid(), studentId, schoolId: student.schoolId, feeStructureId: null,
    description, amount: Number(amount), term: term || 1,
    academicYear: academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    dueDate: dueDate || null, createdBy: req.user.name, createdAt: new Date().toISOString(),
  };
  invoices.insert(record);
  res.status(201).json(invoiceWithBalance(record));
});

function canSeeStudentFinance(user, student) {
  if (user.role === 'STUDENT' && (user.scope?.studentId === student.id || user.studentId === student.id)) return true;
  if (user.role === 'PARENT') {
    if (parentLinks.findOne((l) => l.parentUserId === user.id && l.studentId === student.id)) return true;
  }
  const allowedIds = new Set(schoolIdsForUser(user, schools.all()));
  return allowedIds.has(student.schoolId);
}

router.get('/students/:studentId/summary', authenticate, (req, res) => {
  const student = students.findById(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (!canSeeStudentFinance(req.user, student)) return res.status(403).json({ error: 'No access to this student\'s finance record' });

  const studentInvoices = invoices.find((i) => i.studentId === student.id).map(invoiceWithBalance);
  const totalBilled = studentInvoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = studentInvoices.reduce((s, i) => s + i.paidAmount, 0);
  res.json({
    studentId: student.id,
    studentName: student.name,
    totalBilled,
    totalPaid,
    balance: totalBilled - totalPaid,
    invoices: studentInvoices.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  });
});

router.post('/invoices/:id/payments', authenticate, requireFlag('canManageFinance'), (req, res) => {
  const invoice = invoices.findById(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(invoice.schoolId)) return res.status(403).json({ error: 'No access to this invoice' });

  const { amount, method, reference } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'A positive amount is required' });

  const record = {
    id: uuid(), invoiceId: invoice.id, amount: Number(amount),
    method: method || 'CASH', reference: reference || null,
    recordedBy: req.user.name, paidAt: new Date().toISOString(),
  };
  payments.insert(record);
  res.status(201).json({ payment: record, invoice: invoiceWithBalance(invoice) });
});

// School-wide totals for the finance dashboard — billed, collected,
// outstanding, and how many invoices are overdue.
router.get('/schools/:schoolId/summary', authenticate, requireFlag('canManageFinance'), (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });

  const schoolInvoices = invoices.find((i) => i.schoolId === req.params.schoolId).map(invoiceWithBalance);
  const totalBilled = schoolInvoices.reduce((s, i) => s + i.amount, 0);
  const totalCollected = schoolInvoices.reduce((s, i) => s + i.paidAmount, 0);
  res.json({
    totalBilled,
    totalCollected,
    totalOutstanding: totalBilled - totalCollected,
    overdueCount: schoolInvoices.filter((i) => i.overdue).length,
    invoiceCount: schoolInvoices.length,
  });
});

router.get('/schools/:schoolId/invoices', authenticate, requireFlag('canManageFinance'), (req, res) => {
  const allowedIds = new Set(schoolIdsForUser(req.user, schools.all()));
  if (!allowedIds.has(req.params.schoolId)) return res.status(403).json({ error: 'No access to this school' });
  const list = invoices.find((i) => i.schoolId === req.params.schoolId).map(invoiceWithBalance);
  const withNames = list.map((i) => ({ ...i, studentName: students.findById(i.studentId)?.name || 'Unknown' }));
  res.json(withNames.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
});

module.exports = router;
