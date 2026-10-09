import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MedicalClaim, formatCurrency, isTotalAccurate, getDiscrepancy } from '../types/claim';

/**
 * Exports medical claims records into a formatted Microsoft Excel (.xlsx) workbook.
 */
export function exportClaimsToXLSX(claims: MedicalClaim[], filename?: string): void {
  if (!claims || claims.length === 0) {
    throw new Error('No claims records to export.');
  }

  // Calculate totals
  const totalSubTotal = claims.reduce((sum, c) => sum + (Number(c.subTotal) || 0), 0);
  const totalGst = claims.reduce((sum, c) => sum + (Number(c.gst) || 0), 0);
  const totalGrandTotal = claims.reduce((sum, c) => sum + (Number(c.grandTotal) || 0), 0);
  const calculatedGrandTotal = Math.round((totalSubTotal + totalGst) * 100) / 100;
  const totalDiscrepancies = claims.filter(c => !isTotalAccurate(c.subTotal, c.gst, c.grandTotal)).length;

  // Build rows data
  const dataRows = claims.map((claim, index) => {
    const isAccurate = isTotalAccurate(claim.subTotal, claim.gst, claim.grandTotal);
    const discrepancy = getDiscrepancy(claim.subTotal, claim.gst, claim.grandTotal);
    const expected = Math.round((claim.subTotal + claim.gst) * 100) / 100;

    return {
      'No.': index + 1,
      'Claim ID': claim.id,
      'Date of Visit': claim.claimDate,
      'Employee Name': claim.employeeName,
      'Clinic Name': claim.clinicName,
      'Category': claim.category || 'General',
      'Illness Summary': claim.illnessSummary,
      'Sub-Total ($)': Number(claim.subTotal.toFixed(2)),
      'GST ($)': Number(claim.gst.toFixed(2)),
      'Grand Total ($)': Number(claim.grandTotal.toFixed(2)),
      'Expected Total ($)': Number(expected.toFixed(2)),
      'Audit Status': isAccurate ? 'MATCH' : `DISCREPANCY (${discrepancy > 0 ? '+' : ''}${discrepancy.toFixed(2)})`,
      'Receipt No.': claim.receiptNumber || '-',
      'Notes': claim.notes || '-',
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Add summary blank row and Totals row
  const totalRow = {
    'No.': '',
    'Claim ID': 'TOTALS',
    'Date of Visit': '',
    'Employee Name': `${claims.length} Claim(s)`,
    'Clinic Name': '',
    'Category': '',
    'Illness Summary': totalDiscrepancies === 0 ? 'All claims verified' : `${totalDiscrepancies} claim(s) with discrepancy`,
    'Sub-Total ($)': Number(totalSubTotal.toFixed(2)),
    'GST ($)': Number(totalGst.toFixed(2)),
    'Grand Total ($)': Number(totalGrandTotal.toFixed(2)),
    'Expected Total ($)': Number(calculatedGrandTotal.toFixed(2)),
    'Audit Status': totalDiscrepancies === 0 ? 'ALL VERIFIED' : 'AUDIT REQUIRED',
    'Receipt No.': '',
    'Notes': '',
  };

  XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 });

  // Set explicit column widths for readability
  worksheet['!cols'] = [
    { wch: 6 },  // No.
    { wch: 14 }, // Claim ID
    { wch: 14 }, // Date
    { wch: 22 }, // Employee Name
    { wch: 28 }, // Clinic Name
    { wch: 20 }, // Category
    { wch: 45 }, // Illness Summary
    { wch: 14 }, // Sub-Total
    { wch: 12 }, // GST
    { wch: 16 }, // Grand Total
    { wch: 16 }, // Expected Total
    { wch: 20 }, // Audit Status
    { wch: 16 }, // Receipt No.
    { wch: 25 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical Expense Claims');

  // Metadata summary sheet
  const summarySheetData = [
    { Parameter: 'Report Name', Value: 'Employee Medical Cost Reimbursement Submission' },
    { Parameter: 'Export Date', Value: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }) },
    { Parameter: 'Total Submitted Claims', Value: claims.length },
    { Parameter: 'Aggregate Sub-Total', Value: formatCurrency(totalSubTotal) },
    { Parameter: 'Aggregate GST', Value: formatCurrency(totalGst) },
    { Parameter: 'Aggregate Grand Total', Value: formatCurrency(totalGrandTotal) },
    { Parameter: 'Audit Compliance', Value: totalDiscrepancies === 0 ? '100% Verified' : `${totalDiscrepancies} items flag discrepancy` },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summarySheetData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

  const defaultName = filename || `medical_claims_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, defaultName);
}

/**
 * Exports medical claims records into an executive corporate PDF report.
 */
export function exportClaimsToPDF(claims: MedicalClaim[], options?: { companyName?: string; subtitle?: string; filename?: string }): void {
  if (!claims || claims.length === 0) {
    throw new Error('No claims records to export.');
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const company = options?.companyName || 'Corporate Human Resources & Finance';
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate aggregates
  const totalSubTotal = claims.reduce((sum, c) => sum + (Number(c.subTotal) || 0), 0);
  const totalGst = claims.reduce((sum, c) => sum + (Number(c.gst) || 0), 0);
  const totalGrandTotal = claims.reduce((sum, c) => sum + (Number(c.grandTotal) || 0), 0);
  const discrepanciesCount = claims.filter(c => !isTotalAccurate(c.subTotal, c.gst, c.grandTotal)).length;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative Accent bar
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MEDICAL COST SUBMISSION & AUDIT REPORT', 14, 12);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`${company}  |  Generated on ${currentDate}`, 14, 19);

  // Summary Cards Top Row (mm positions)
  const cardY = 33;
  const cardH = 16;
  const colW = (pageWidth - 28 - 12) / 4;

  const cards = [
    { label: 'TOTAL CLAIMS', val: `${claims.length} Record(s)`, color: [241, 245, 249], border: [203, 213, 225] },
    { label: 'AGGREGATE SUB-TOTAL', val: formatCurrency(totalSubTotal), color: [241, 245, 249], border: [203, 213, 225] },
    { label: 'AGGREGATE GST', val: formatCurrency(totalGst), color: [241, 245, 249], border: [203, 213, 225] },
    { 
      label: 'AGGREGATE GRAND TOTAL', 
      val: formatCurrency(totalGrandTotal), 
      color: discrepanciesCount > 0 ? [254, 242, 242] : [240, 253, 244], 
      border: discrepanciesCount > 0 ? [248, 113, 113] : [74, 222, 128],
      highlight: true
    },
  ];

  cards.forEach((card, idx) => {
    const x = 14 + idx * (colW + 4);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.setDrawColor(card.border[0], card.border[1], card.border[2]);
    doc.roundedRect(x, cardY, colW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(card.label, x + 4, cardY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(card.val, x + 4, cardY + 12);
  });

  // Table Body mapping
  const tableData = claims.map((claim, index) => {
    const isAccurate = isTotalAccurate(claim.subTotal, claim.gst, claim.grandTotal);
    const discrepancy = getDiscrepancy(claim.subTotal, claim.gst, claim.grandTotal);
    const statusText = isAccurate 
      ? 'Verified' 
      : `Mismatch (${discrepancy > 0 ? '+' : ''}${discrepancy.toFixed(2)})`;

    return [
      (index + 1).toString(),
      claim.claimDate || '-',
      claim.employeeName,
      claim.clinicName,
      claim.illnessSummary,
      formatCurrency(claim.subTotal),
      formatCurrency(claim.gst),
      formatCurrency(claim.grandTotal),
      statusText,
    ];
  });

  // Add Grand Totals footer row
  const tableFooter = [
    [
      '',
      '',
      `Total (${claims.length})`,
      '',
      discrepanciesCount === 0 ? 'All Records Mathematically Verified' : `Alert: ${discrepanciesCount} Discrepancy Found`,
      formatCurrency(totalSubTotal),
      formatCurrency(totalGst),
      formatCurrency(totalGrandTotal),
      discrepanciesCount === 0 ? 'PASSED' : 'CHECK REQ.',
    ],
  ];

  // AutoTable Render
  autoTable(doc, {
    startY: 53,
    head: [[
      '#',
      'Date',
      'Employee Name',
      'Clinic Name',
      'Summary of Illness',
      'Sub-Total',
      'GST',
      'Grand Total',
      'Audit Status',
    ]],
    body: tableData,
    foot: tableFooter,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 36, fontStyle: 'bold' },
      3: { cellWidth: 42 },
      4: { cellWidth: 70 }, // Summary of illness
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      8: { cellWidth: 26, halign: 'center' },
    },
    didParseCell: (data) => {
      // Highlight discrepancy status cells
      if (data.section === 'body' && data.column.index === 8) {
        const text = String(data.cell.raw);
        if (text.includes('Mismatch')) {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 101, 52]; // green-800
        }
      }
      if (data.section === 'foot' && data.column.index === 8) {
        if (discrepanciesCount > 0) {
          data.cell.styles.textColor = [220, 38, 38];
        } else {
          data.cell.styles.textColor = [22, 101, 52];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer / Approval Signatures
  // Get final Y after table
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  
  if (finalY + 30 < pageHeight) {
    const signY = Math.max(finalY + 12, pageHeight - 26);
    doc.setDrawColor(203, 213, 225);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    // Sign off boxes
    const sigColW = (pageWidth - 28 - 20) / 3;

    // Box 1: Claimant Declaration
    doc.line(14, signY + 10, 14 + sigColW, signY + 10);
    doc.text('Claimant / Employee Signature & Date', 14, signY + 14);

    // Box 2: Manager Approval
    doc.line(14 + sigColW + 10, signY + 10, 14 + sigColW * 2 + 10, signY + 10);
    doc.text('Department Head / Approver Signature', 14 + sigColW + 10, signY + 14);

    // Box 3: Finance Verification
    doc.line(14 + sigColW * 2 + 20, signY + 10, pageWidth - 14, signY + 10);
    doc.text('Finance & Payroll Verification Stamp', 14 + sigColW * 2 + 20, signY + 14);
  }

  // Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages}  |  MedClaim Internal Record  |  Confidential`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const defaultName = options?.filename || `medical_claims_report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(defaultName);
}

/**
 * Exports medical claims records to CSV format.
 */
export function exportClaimsToCSV(claims: MedicalClaim[], filename?: string): void {
  const headers = ['No.', 'Claim ID', 'Date', 'Employee Name', 'Clinic Name', 'Category', 'Summary of Illness', 'Sub-Total ($)', 'GST ($)', 'Grand Total ($)', 'Verification', 'Receipt No'];
  const rows = claims.map((c, i) => [
    i + 1,
    `"${c.id}"`,
    `"${c.claimDate}"`,
    `"${c.employeeName.replace(/"/g, '""')}"`,
    `"${c.clinicName.replace(/"/g, '""')}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
    `"${c.illnessSummary.replace(/"/g, '""')}"`,
    c.subTotal.toFixed(2),
    c.gst.toFixed(2),
    c.grandTotal.toFixed(2),
    isTotalAccurate(c.subTotal, c.gst, c.grandTotal) ? 'VERIFIED' : 'MISMATCH',
    `"${(c.receiptNumber || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename || `medical_claims_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
