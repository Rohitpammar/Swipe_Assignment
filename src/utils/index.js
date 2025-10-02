
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth';

// Initialize PDF.js worker early
try {
	pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
} catch (error) {
	console.warn('Failed to set PDF.js worker source:', error);
}

// PDF parsing utility
export async function parseResumePDF(file) {
	const arrayBuffer = await file.arrayBuffer();
	const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
	let text = '';
	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const content = await page.getTextContent();
		text += content.items.map(item => item.str).join(' ') + '\n';
	}
	return text;
}

// DOCX parsing utility
export async function parseResumeDOCX(file) {
	const arrayBuffer = await file.arrayBuffer();
	const { value } = await mammoth.extractRawText({ arrayBuffer });
	return value;
}

// Extract candidate info from text
export function extractCandidateInfo(text) {
	// Email regex
	const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
	// Phone regex (matches various formats)
	const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,}/);
	// Name: try to get from first 5 lines or "Name:" label
	let name = null;
	const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
	for (let i = 0; i < Math.min(5, lines.length); i++) {
		if (/name[:\s]/i.test(lines[i])) {
			name = lines[i].replace(/name[:\s]*/i, '').trim();
			break;
		}
	}
	if (!name && lines.length) {
		// Fallback: first line with 2+ capitalized words
		const capWords = lines[0].match(/([A-Z][a-z]+\s){1,}[A-Z][a-z]+/);
		if (capWords) name = capWords[0].trim();
	}
	return {
		name: name || null,
		email: emailMatch ? emailMatch[0] : null,
		phone: phoneMatch ? phoneMatch[0] : null,
	};
}

// Main entry: parse resume file and extract info
export async function parseResume(file) {
	try {
		let text = '';
		if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
			text = await parseResumePDF(file);
		} else if (
			file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
			file.name.endsWith('.docx')
		) {
			text = await parseResumeDOCX(file);
		} else {
			throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
		}
		const info = extractCandidateInfo(text);
		return { ...info, resumeText: text };
	} catch (err) {
		console.error('Resume parsing error:', err);
		// Provide more specific error messages
		if (err.message.includes('worker')) {
			return { error: 'PDF processing failed. Please try uploading a different PDF file or use DOCX format instead.' };
		}
		if (err.message.includes('Invalid PDF')) {
			return { error: 'Invalid PDF file. Please ensure the file is not corrupted and try again.' };
		}
		return { error: err.message || 'Failed to parse resume. Please try a different file.' };
	}
}

// Email validation
export function validateEmail(email) {
	return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// Phone validation (10+ digits)
export function validatePhone(phone) {
	return phone && phone.replace(/\D/g, '').length >= 10;
}
