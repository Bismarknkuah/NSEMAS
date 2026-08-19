const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } = require('docx');

/**
 * Universal export
 * -----------------
 * This is deliberately a pure formatter, not a data-access endpoint. The
 * frontend already fetched its rows through the normal, properly-scoped
 * API (student lists, exam results, invoices, whatever) — the person
 * asking for a download already had the right to see everything in it.
 * This module just turns rows-the-client-already-has into a file; it
 * never reads the database itself. That's why the route only requires
 * `authenticate` and not a resource-specific permission check — there's
 * no resource here, only formatting, the same way a browser's own "Print"
 * button doesn't re-check permissions on what's already on screen.
 */

function csvEscape(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(title, columns, rows) {
  const header = columns.map((c) => csvEscape(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c.key])).join(',')).join('\n');
  return `${header}\n${body}`;
}

async function toExcelBuffer(title, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NSEMAS';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(title.slice(0, 31) || 'Export');
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(14, c.label.length + 4) }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3D2E' } };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  rows.forEach((r) => sheet.addRow(r));
  return workbook.xlsx.writeBuffer();
}

function toPDFBuffer(title, columns, rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: columns.length > 5 ? 'landscape' : 'portrait' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).fillColor('#0B3D2E').text(title, { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor('#666').text(`Generated ${new Date().toLocaleString()} · NSEMAS`, { align: 'left' });
    doc.moveDown(1);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / columns.length;
    const startX = doc.page.margins.left;
    let y = doc.y;

    function drawRow(values, opts = {}) {
      const rowHeight = 18;
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      if (opts.header) {
        doc.rect(startX, y, pageWidth, rowHeight).fill('#0B3D2E');
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      } else {
        doc.fillColor('#111').fontSize(8.5).font('Helvetica');
      }
      values.forEach((v, i) => {
        doc.text(String(v ?? ''), startX + i * colWidth + 4, y + 5, { width: colWidth - 8, ellipsis: true });
      });
      y += rowHeight;
    }

    drawRow(columns.map((c) => c.label), { header: true });
    rows.forEach((r) => drawRow(columns.map((c) => r[c.key])));

    doc.end();
  });
}

async function toWordBuffer(title, columns, rows) {
  const headerRow = new TableRow({
    children: columns.map((c) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: c.label, bold: true, color: 'FFFFFF' })] })],
      shading: { fill: '0B3D2E' },
    })),
  });
  const dataRows = rows.map((r) => new TableRow({
    children: columns.map((c) => new TableCell({ children: [new Paragraph(String(r[c.key] ?? ''))] })),
  }));

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: `Generated ${new Date().toLocaleString()} · NSEMAS`, spacing: { after: 200 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

module.exports = { toCSV, toExcelBuffer, toPDFBuffer, toWordBuffer };
