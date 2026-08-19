const express = require('express');
const { authenticate } = require('../middleware/auth');
const { toCSV, toExcelBuffer, toPDFBuffer, toWordBuffer } = require('../utils/exporters');

const router = express.Router();

const MAX_ROWS = 5000; // sane ceiling — this formats what's already on screen, not a bulk-dump tool

router.post('/', authenticate, async (req, res) => {
  const { format, title, columns, rows } = req.body;
  if (!['csv', 'excel', 'pdf', 'word'].includes(format)) {
    return res.status(400).json({ error: 'format must be one of csv, excel, pdf, word' });
  }
  if (!Array.isArray(columns) || !columns.length || !columns.every((c) => c.key && c.label)) {
    return res.status(400).json({ error: 'columns must be a non-empty array of {key, label}' });
  }
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' });
  if (rows.length > MAX_ROWS) return res.status(400).json({ error: `Too many rows for a single export (max ${MAX_ROWS}) — narrow your filter first` });

  const safeTitle = (title || 'NSEMAS Export').slice(0, 120);
  const filenameBase = safeTitle.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'export';

  try {
    if (format === 'csv') {
      const csv = toCSV(safeTitle, columns, rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      return res.send(csv);
    }
    if (format === 'excel') {
      const buffer = await toExcelBuffer(safeTitle, columns, rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`);
      return res.send(Buffer.from(buffer));
    }
    if (format === 'pdf') {
      const buffer = await toPDFBuffer(safeTitle, columns, rows);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
      return res.send(buffer);
    }
    if (format === 'word') {
      const buffer = await toWordBuffer(safeTitle, columns, rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.docx"`);
      return res.send(buffer);
    }
  } catch (err) {
    console.error('Export generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate the export file' });
  }
});

module.exports = router;
