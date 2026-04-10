import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDFFromHTML(
  elementId: string,
  fileName: string,
  orientationL: 'landscape' | 'portrait' = 'portrait'
) {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: orientationL, unit: 'mm', format: 'a4' });

    const imgWidth = orientationL === 'landscape' ? 277 : 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

export async function generateAdvancedPDF(
  userData: any,
  categories: any,
  aiReport: string,
  fileName: string
) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // PAGE 1: COVER & SUMMARY
  let yPosition = 20;

  pdf.setFontSize(28);
  pdf.setFont('arial', 'bold');
  pdf.text('EcoTrace', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('arial', 'normal');
  pdf.text('Waste Management & Sustainability Report', 20, yPosition);
  yPosition += 15;

  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 20;

  pdf.setFontSize(11);
  pdf.setFont('arial', 'bold');
  pdf.text('Employee Details', 20, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('arial', 'normal');
  pdf.text(`Name: ${userData.userName}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Emp ID: ${userData.empId}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Department: ${userData.dept}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
  yPosition += 20;

  pdf.setFont('arial', 'bold');
  pdf.text(`Total Carbon Footprint: ${userData.totalCO2} kg CO₂ / month`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Earths Required: ${userData.earths.toFixed(1)}`, 20, yPosition);
  yPosition += 20;

  pdf.setFontSize(11);
  pdf.text('Category Breakdown', 20, yPosition);
  yPosition += 10;

  Object.entries(categories).forEach(([key, value]: [string, any]) => {
    pdf.setFontSize(9);
    pdf.text(`${key.toUpperCase()}: ${value.co2} kg CO₂ (${value.pct}%)`, 20, yPosition);
    yPosition += 6;
  });

  // PAGE 2: AI REPORT
  pdf.addPage();
  yPosition = 20;

  pdf.setFontSize(14);
  pdf.setFont('arial', 'bold');
  pdf.text('Root Cause & Environmental Impact Analysis', 20, yPosition);
  yPosition += 15;

  pdf.setFontSize(9);
  pdf.setFont('arial', 'normal');
  
  const splitText = pdf.splitTextToSize(aiReport, 170);
  splitText.forEach((line: string) => {
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.text(line, 20, yPosition);
    yPosition += 5;
  });

  // PAGE 3+: DETAILED RESPONSES
  pdf.addPage();
  yPosition = 20;

  pdf.setFontSize(14);
  pdf.setFont('arial', 'bold');
  pdf.text('Detailed Assessment Responses', 20, yPosition);
  yPosition += 15;

  pdf.setFontSize(9);
  pdf.setFont('arial', 'normal');

  // Add responses details (placeholder - would be replaced with actual response data)
  pdf.text('See detailed responses below:', 20, yPosition);
  yPosition += 10;

  pdf.save(fileName);
}
