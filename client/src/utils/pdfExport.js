import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportReportToPDF({ title, subtitle, dateRange, headers, rows, filename = 'throttlex-report.pdf' }) {
  const doc = new jsPDF();

  // Branding Header
  doc.setFillColor(15, 19, 29); // Dark background
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 85, 0); // Racing Orange
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('THROTTLEX', 14, 15);

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text('OWN THE ROAD. | Rental Business Manager', 14, 23);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 155, 23);

  // Report Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 46);
  }

  // Table
  doc.autoTable({
    startY: subtitle ? 52 : 46,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 27, 45],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(filename);
}
