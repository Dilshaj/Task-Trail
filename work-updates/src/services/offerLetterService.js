import api from './api';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const API_URL = 'offer-letter';

// =========================================================
// ORIGINAL API FUNCTIONS (Required by the rest of the app)
// =========================================================

export const saveOfferLetter = async (offerData) => {
    try {
        const response = await api.post(`${API_URL}/`, offerData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Failed to save offer letter');
    }
};

export const getOfferLetters = async (projectId = null) => {
    try {
        const params = {};
        if (projectId) params.project_id = projectId;
        const response = await api.get(`${API_URL}/`, { params });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch offer letters:', error);
        return [];
    }
};

export const downloadOfferLetter = async (employeeId) => {
    try {
        const offers = await getOfferLetters();
        const offer = offers.find(o => String(o.employeeId || o.employee_id) === String(employeeId));
        if (!offer) {
            alert('Offer letter details not found in database.');
            return;
        }

        const mappedData = {
            candidateName: offer.employeeName || offer.employee_name || "Unknown Candidate",
            candidateAddress: "Ainada, Visakhapatnam, Andhrapradesh 535005.",
            offerDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            jobTitle: offer.role || "Employee",
            department: "Development",
            reportingManager: "Manager",
            joiningDate: offer.joiningDate || offer.joining_date || new Date().toLocaleDateString(),
            workLocation: offer.location || "Rolugunta[Visakhapatnam]",
            ctc: offer.package ? String(offer.package) : "0"
        };

        const pdfBytes = await generatePDF_OptionA(mappedData);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Create blob link to download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `OfferLetter_${employeeId}.pdf`);
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to generate PDF. Please try again.');
    }
};

// =========================================================
// DILSHAJ INFOTECH OFFER LETTER GENERATOR PLUGIN
// (Adapted for Browser/Vite)
// =========================================================

function sanitizeWinAnsi(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/₹/g, 'Rs. ').replace(/\u00A0/g, ' ').replace(/[^\x00-\xFF]/g, '');
}

function wrapText(text, width, font, fontSize) {
    const sanitizedText = sanitizeWinAnsi(text);
    const words = sanitizedText.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > width) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function drawTextWithScaling(page, text, x, y, maxWidth, font, initialFontSize, color = rgb(0.1, 0.1, 0.1)) {
    const sanitizedText = sanitizeWinAnsi(text);
    let fontSize = initialFontSize;
    let textWidth = font.widthOfTextAtSize(sanitizedText, fontSize);
    while (textWidth > maxWidth && fontSize > 7) {
        fontSize -= 0.5;
        textWidth = font.widthOfTextAtSize(sanitizedText, fontSize);
    }
    page.drawText(sanitizedText, { x, y, size: fontSize, font, color });
    return fontSize;
}

function drawLabelValue(page, label, value, x, y, fontBold, fontNormal, fontSize) {
    const cleanLabel = sanitizeWinAnsi(label);
    const cleanValue = sanitizeWinAnsi(value);
    page.drawText(cleanLabel, { x, y, size: fontSize, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    const labelWidth = fontBold.widthOfTextAtSize(cleanLabel, fontSize);
    page.drawText(cleanValue, { x: x + labelWidth + 4, y, size: fontSize, font: fontNormal, color: rgb(0.1, 0.1, 0.1) });
}

function drawInlineBoldParagraph(page, label, text, x, y, fontBold, fontNormal, fontSize, contentWidth, lineHeight) {
    const cleanLabel = sanitizeWinAnsi(label);
    const cleanText = sanitizeWinAnsi(text);
    const labelWidth = fontBold.widthOfTextAtSize(cleanLabel, fontSize);
    page.drawText(cleanLabel, { x, y, size: fontSize, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    const words = cleanText.split(' ');
    let currentY = y;
    let currentLine = '';
    let isFirstLine = true;

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = fontNormal.widthOfTextAtSize(testLine, fontSize);
        const availableWidth = isFirstLine ? (contentWidth - labelWidth - 4) : contentWidth;

        if (testWidth > availableWidth) {
            const drawX = isFirstLine ? (x + labelWidth + 4) : x;
            page.drawText(currentLine, { x: drawX, y: currentY, size: fontSize, font: fontNormal, color: rgb(0.1, 0.1, 0.1) });
            currentY -= lineHeight;
            currentLine = word;
            isFirstLine = false;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        const drawX = isFirstLine ? (x + labelWidth + 4) : x;
        page.drawText(currentLine, { x: drawX, y: currentY, size: fontSize, font: fontNormal, color: rgb(0.1, 0.1, 0.1) });
    }
    return currentY - lineHeight;
}

function formatCurrency(val) {
    const numericVal = Number(String(val).replace(/[^0-9.]/g, ''));
    if (isNaN(numericVal)) return sanitizeWinAnsi(String(val));
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(numericVal);
    return sanitizeWinAnsi(formatted);
}

/**
 * OPTION A: Generate PDF Bytes using pdf-lib (Vector Layout)
 * 
 * @param {Object} data - Input candidate parameters
 * @param {string} [customLetterheadUrl] - Optional URL to LETTER HEAD.pdf
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function generatePDF_OptionA(data, customLetterheadUrl = '/LETTER HEAD.pdf') {
    // In browser, we must fetch the letterhead PDF via URL instead of fs.readFileSync
    // Use encodeURI for spaces and add a cache-buster to prevent loading cached index.html fallbacks
    const urlWithCacheBuster = `${encodeURI(customLetterheadUrl)}?v=${Date.now()}`;
    const response = await fetch(urlWithCacheBuster);
    
    if (!response.ok) {
        throw new Error(`Letterhead template PDF not found at ${customLetterheadUrl}. Please ensure it is placed in the public directory.`);
    }
    const letterheadBytes = await response.arrayBuffer();

    // Defensively trim fields
    const cleanData = {};
    for (const key in data) {
        cleanData[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
    }

    const letterheadDoc = await PDFDocument.load(letterheadBytes);
    const pdfDoc = await PDFDocument.create();

    const fontSans = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    const fontSansBold = await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.27;
    const pageHeight = 841.89;
    const leftMargin = 65; 
    const rightMargin = 60.27; 
    const contentWidth = pageWidth - leftMargin - rightMargin; 
    const topMargin = 635;
    const bottomMargin = 75;

    const cloneTemplatePage = async() => {
        const [copiedPage] = await pdfDoc.copyPages(letterheadDoc, [0]);
        return pdfDoc.addPage(copiedPage);
    };

    const formattedCTC = formatCurrency(cleanData.ctc);

    // ==========================================
    // PAGE 1: Offer Details & Basic Terms
    // ==========================================
    const page1 = await cloneTemplatePage();
    let y1 = topMargin;

    const headerText = 'OFFER LETTER';
    const headerWidth = fontSansBold.widthOfTextAtSize(headerText, 15);
    page1.drawText(headerText, { x: (pageWidth - headerWidth) / 2, y: y1, size: 15, font: fontSansBold, color: rgb(0.08, 0.12, 0.2) });
    y1 -= 24;

    const dateText = `Date: ${cleanData.offerDate}`;
    page1.drawText(dateText, { x: leftMargin, y: y1, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y1 -= 24;

    page1.drawText('To,', { x: leftMargin, y: y1, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y1 -= 18;
    drawTextWithScaling(page1, cleanData.candidateName, leftMargin, y1, contentWidth, fontSansBold, 13, rgb(0.08, 0.12, 0.2));
    y1 -= 18;
    const addressLines = wrapText(cleanData.candidateAddress || 'Ainada, Visakhapatnam, Andhrapradesh 535005.', contentWidth, fontSans, 12);
    for (const line of addressLines) {
        page1.drawText(line, { x: leftMargin, y: y1, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y1 -= 16;
    }
    y1 -= 12;

    page1.drawText(`Dear ${cleanData.candidateName.split(' ')[0] || cleanData.candidateName},`, { x: leftMargin, y: y1, size: 12.5, font: fontSansBold, color: rgb(0.1, 0.1, 0.1) });
    y1 -= 18;

    const introText = `We are delighted to offer you the position of Junior developer at Dilshaj Infotech. We believe your skills and passion align perfectly with our vision of empowering intelligence and building innovative solutions for the future.`;
    for (const line of wrapText(introText, contentWidth, fontSans, 12)) {
        page1.drawText(line, { x: leftMargin, y: y1, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y1 -= 16;
    }
    y1 -= 12;

    page1.drawText('1. Position Details', { x: leftMargin, y: y1, size: 13.5, font: fontSansBold, color: rgb(0.08, 0.12, 0.2) });
    y1 -= 18;

    const detailsList = [
        { label: 'Position:', value: cleanData.jobTitle },
        { label: 'Department:', value: cleanData.department || 'Development' },
        { label: 'Reporting To:', value: cleanData.reportingManager },
        { label: 'Employment Type:', value: 'Full-Time' },
        { label: 'Date of Joining:', value: cleanData.joiningDate },
        { label: 'Work Location:', value: cleanData.workLocation || 'Rolugunta[Visakhapatnam]' }
    ];

    for (const item of detailsList) {
        drawLabelValue(page1, item.label, item.value, leftMargin + 10, y1, fontSansBold, fontSans, 11.5);
        y1 -= 16;
    }
    y1 -= 12;

    page1.drawText('2. Compensation and Benefits', { x: leftMargin, y: y1, size: 13.5, font: fontSansBold, color: rgb(0.08, 0.12, 0.2) });
    y1 -= 18;
    drawLabelValue(page1, 'Total CTC: ', `${formattedCTC} per annum.`, leftMargin, y1, fontSansBold, fontSans, 12);
    y1 -= 16;

    const compDesc = `During probation, either party may terminate employment with 15 days written notice/digital notice. Upon successful completion, you will be confirmed as a regular employee. Additional benefits such as performance bonuses, leaves, and incentives may be applicable as per company policy.`;
    y1 = drawInlineBoldParagraph(page1, 'Probation Period: ', `3 months (performance-based confirmation). ${compDesc}`, leftMargin, y1, fontSansBold, fontSans, 12, contentWidth, 14);
    y1 -= 12;

    page1.drawText('3. Working Hours', { x: leftMargin, y: y1, size: 13.5, font: fontSansBold, color: rgb(0.08, 0.12, 0.2) });
    y1 -= 18;
    const hoursText = `Standard working hours are 9:00 AM to 5:00 PM, Monday to Friday. Employees are expected to adhere to punctuality and attendance norms. Work-from-home or flexible hours may be allowed at management discretion.`;
    for (const line of wrapText(hoursText, contentWidth, fontSans, 12)) {
        page1.drawText(line, { x: leftMargin, y: y1, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y1 -= 16;
    }

    // ==========================================
    // PAGE 2: General Terms (Authority, Assignments, Facts)
    // ==========================================
    const page2 = await cloneTemplatePage();
    let y2 = topMargin;

    const authorityText = 'You will not enter into any contracts, commitments or dealings on behalf of the Company for which you have no express authority nor alter or be a party to any alteration of any principle or policy of the Company or exceed the authority or discretion vested in you without the previous sanction of the Company.';
    y2 = drawInlineBoldParagraph(page2, 'Authority: ', authorityText, leftMargin, y2, fontSansBold, fontSans, 12, contentWidth, 14);
    y2 -= 12;

    const deputationText = 'Though you have been engaged for a specific position, the Company reserves the right to send you on training/deputation/secondment/transfer/assignments to any other locations, departments or units of the Company or its associate companies, subsidiaries, group companies or customer locations, whether in India or abroad. In such case, the terms and conditions of service applicable to the new assignment will govern you.';
    y2 = drawInlineBoldParagraph(page2, 'Assignments / Transfer / Deputation: ', deputationText, leftMargin, y2, fontSansBold, fontSans, 12, contentWidth, 14);
    y2 -= 10;

    const deputationTextPart2 = 'You shall, only at the request of the Company, enter into a direct agreement or undertaking with any customer to whom you may be assigned/seconded/deputed accepting restrictions which the customer may reasonably require for the protection of its legitimate interests.';
    for (const line of wrapText(deputationTextPart2, contentWidth, fontSans, 12)) {
        page2.drawText(line, { x: leftMargin, y: y2, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y2 -= 14;
    }
    y2 -= 10;

    const deputationTextPart3 = 'You are an employee of the Company and are not and shall not become the employee or agent of any customer at whose premises you may be deployed, at any time during your services with the Company. The Company shall be responsible for the payment of all your compensation, benefits and insurance as applicable and you shall not be entitled to claim any customer employee benefits. You acknowledge that you are not an employee of the customer for any purpose and shall not exercise any rights or seek any benefit accruing to the regular employees of the customer.';
    for (const line of wrapText(deputationTextPart3, contentWidth, fontSans, 12)) {
        page2.drawText(line, { x: leftMargin, y: y2, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y2 -= 14;
    }
    y2 -= 12;

    const factsText = 'It must be specifically understood that this offer is made based on your proficiency on technical/professional skills you have declared to possess as per the application, and on the ability to handle any assignment / job independently anywhere in India or overseas. In case, at a later date, any of your statements/particulars furnished are found to be false or misleading, or your performance is not up to the mark or falls short of minimum standards set by the Company, the Company shall have the right to terminate your services at its own discretion without notice or compensation in lieu thereof. Further, your appointment is contingent upon satisfactory reference and background checks which may be conducted at any time from the date of this Offer Letter to 90 (ninety) days of your joining date, and which include verification of your application materials, education and employment history. Your employment is also contingent upon your ability to work for the Company without restriction (i.e., you do not have any non-compete obligations or other restrictive clauses with any previous employer).';
    y2 = drawInlineBoldParagraph(page2, 'Statement of Facts: ', factsText, leftMargin, y2, fontSansBold, fontSans, 12, contentWidth, 14);

    // ==========================================
    // PAGE 3: Policies & General Terms (Declaration section REMOVED)
    // ==========================================
    const page3 = await cloneTemplatePage();
    let y3 = topMargin;

    page3.drawText('4. Company Policies', { x: leftMargin, y: y3, size: 13.5, font: fontSansBold, color: rgb(0.08, 0.12, 0.2) });
    y3 -= 18;

    // 4.1
    page3.drawText('4.1 Code of Conduct', { x: leftMargin, y: y3, size: 11.5, font: fontSansBold, color: rgb(0.1, 0.1, 0.1) });
    y3 -= 15;
    page3.drawText('You are expected to:', { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y3 -= 14;
    const conductText = 'Maintain professionalism and respect in the workplace. Protect company assets, data, and intellectual property. Avoid conflicts of interest and unauthorized disclosures.';
    for (const line of wrapText(conductText, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    y3 -= 8;

    // 4.2
    page3.drawText('4.2 Confidentiality', { x: leftMargin, y: y3, size: 11.5, font: fontSansBold, color: rgb(0.1, 0.1, 0.1) });
    y3 -= 15;
    const confidentialityText = 'All information related to company operations, clients, or technology must remain confidential. Any violation will result in disciplinary action or termination.';
    for (const line of wrapText(confidentialityText, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    y3 -= 8;

    // 4.3
    page3.drawText('4.3 Probation and Termination', { x: leftMargin, y: y3, size: 11.5, font: fontSansBold, color: rgb(0.1, 0.1, 0.1) });
    y3 -= 15;
    const probationText1 = 'During probation, either party can terminate employment with 15 days written notice/digital Notice. Post-confirmation, the notice period will be 30 days.';
    for (const line of wrapText(probationText1, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    const probationText2 = 'The company reserves the right to terminate employment for misconduct or policy violation.';
    for (const line of wrapText(probationText2, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    y3 -= 8;

    // 4.4
    page3.drawText('4.4 Data and System Policy', { x: leftMargin, y: y3, size: 11.5, font: fontSansBold, color: rgb(0.1, 0.1, 0.1) });
    y3 -= 15;
    const systemText1 = 'All employees must follow cybersecurity and data protection guidelines.';
    for (const line of wrapText(systemText1, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    const systemText2 = 'Use of company systems for personal or illegal activities is strictly prohibited.';
    for (const line of wrapText(systemText2, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    y3 -= 8;

    // 4.5
    page3.drawText('4.5 Anti-Harassment Policy', { x: leftMargin, y: y3, size: 11.5, font: fontSansBold, color: rgb(0.1, 0.1, 0.1) });
    y3 -= 15;
    const harassmentText = 'Dilshaj Infotech promotes a safe and inclusive work culture. Harassment or discrimination of any kind will not be tolerated.';
    for (const line of wrapText(harassmentText, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    y3 -= 8;

    // 4.6
    page3.drawText('4.6 Intellectual Property', { x: leftMargin, y: y3, size: 11.5, font: fontSansBold, color: rgb(0.1, 0.1, 0.1) });
    y3 -= 15;
    const ipText = 'Any work, code, or innovation developed during your employment remains the property of Dilshaj Infotech.';
    for (const line of wrapText(ipText, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    y3 -= 12;

    // 5. General Terms
    page3.drawText('5. General Terms', { x: leftMargin, y: y3, size: 13.5, font: fontSansBold, color: rgb(0.08, 0.12, 0.2) });
    y3 -= 18;

    const generalIntro1 = 'This offer is contingent upon verification of your documents and references.';
    for (const line of wrapText(generalIntro1, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    const generalIntro2 = 'You agree to abide by all company rules, policies, and amendments made from time to time. Failure to comply with company policies may result in disciplinary action or termination.';
    for (const line of wrapText(generalIntro2, contentWidth, fontSans, 12)) {
        page3.drawText(line, { x: leftMargin, y: y3, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y3 -= 14;
    }
    y3 -= 8;

    // Work Performance
    const perfText = 'The Company will expect you to work with a high standard of initiative and productivity. In view of your position, you are expected to perform efficiently to ensure quality results. which sometimes may require extra hours of effort. In addition, you may be required to work in shifts, including night shifts, depending upon the organizational needs.';
    y3 = drawInlineBoldParagraph(page3, 'Work Performance: ', perfText, leftMargin, y3, fontSansBold, fontSans, 12, contentWidth, 14);

    // ==========================================
    // PAGE 4: Acceptance & Signature Blocks
    // ==========================================
    const page4 = await cloneTemplatePage();
    let y4 = topMargin;

    // "6. Acceptance"
    page4.drawText('6. Acceptance', { x: leftMargin, y: y4, size: 13.5, font: fontSansBold, color: rgb(0.08, 0.12, 0.2) });
    y4 -= 20;

    const acceptanceText = `Please sign and return a scanned copy of this letter by ${cleanData.joiningDate} to confirm your acceptance of the offer and the terms outlined herein.`;
    for (const line of wrapText(acceptanceText, contentWidth, fontSans, 12)) {
        page4.drawText(line, { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y4 -= 16;
    }
    const acceptanceTextPart2 = 'We are excited to welcome you to Dilshaj Infotech and look forward to your valuable contributions toward our mission of empowering intelligence and building the future.';
    for (const line of wrapText(acceptanceTextPart2, contentWidth, fontSans, 12)) {
        page4.drawText(line, { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
        y4 -= 16;
    }
    y4 -= 24;

    // Signatures / Warm regards - uniform font size and dark colors
    page4.drawText('Warm regards,', { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 18;
    page4.drawText('For Dilshaj Infotech', { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 35;

    page4.drawLine({ start: { x: leftMargin, y: y4 }, end: { x: leftMargin + 140, y: y4 }, thickness: 0.5, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 15;

    // Dilshaj Shaik is Bold
    page4.drawText('Dilshaj Shaik', { x: leftMargin, y: y4, size: 12, font: fontSansBold, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 15;
    page4.drawText('Ceo Dilshaj Infotech', { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 15;
    page4.drawText('Email: dilshajceo@dilshajinfotech.tech', { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 15;
    page4.drawText('recruitmentcell@dilshajinfotech.tech', { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 15;
    page4.drawText('Phone: +91-8977272783', { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 30;

    // Accepted by block
    page4.drawText(`Accepted by : ${cleanData.candidateName}`, { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 35;

    page4.drawLine({ start: { x: leftMargin, y: y4 }, end: { x: leftMargin + 140, y: y4 }, thickness: 0.5, color: rgb(0.1, 0.1, 0.1) });
    y4 -= 24;

    page4.drawText('Date: ____________________', { x: leftMargin, y: y4, size: 12, font: fontSans, color: rgb(0.1, 0.1, 0.1) });

    try {
        pdfDoc.getForm().flatten();
    } catch (e) {}

    return await pdfDoc.save();
}
