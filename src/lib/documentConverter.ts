/**
 * Document Converter Service
 *
 * Converts various document formats (PDF, Word, text) to Markdown format
 * for further processing with LLM-based structuring.
 *
 * NOTE: Browser-based implementation using PDF.js
 */

import { logger } from './logger';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use CDN for better compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

export type SupportedFileType = 'pdf' | 'txt' | 'md';

export interface ConversionResult {
  markdown: string;
  metadata?: {
    pageCount?: number;
    author?: string;
    title?: string;
  };
}

/**
 * Determine file type from file name or MIME type
 */
export function getFileType(file: File): SupportedFileType | null {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'txt':
      return 'txt';
    case 'md':
      return 'md';
    default:
      return null;
  }
}

/**
 * Convert PDF to Markdown using PDF.js
 */
async function convertPDFToMarkdown(arrayBuffer: ArrayBuffer): Promise<ConversionResult> {
  logger.debug('Converting PDF to markdown...');

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const numPages = pdf.numPages;
    const textParts: string[] = [];

    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      textParts.push(pageText);
    }

    // Join all pages and clean up
    const cleanedText = textParts
      .join('\n\n')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    logger.info(`PDF converted: ${numPages} pages, ${cleanedText.length} characters`);

    return {
      markdown: cleanedText,
      metadata: {
        pageCount: numPages,
      },
    };
  } catch (error) {
    logger.error('Error converting PDF:', error);
    throw new Error('PDF-tiedoston muuntaminen epäonnistui');
  }
}


/**
 * Convert text file to Markdown (basically just return as-is)
 */
async function convertTextToMarkdown(text: string): Promise<ConversionResult> {
  logger.debug('Processing text file...');

  return {
    markdown: text.trim(),
    metadata: {},
  };
}

/**
 * Main conversion function - converts any supported file type to Markdown
 */
export async function convertToMarkdown(file: File): Promise<ConversionResult> {
  const fileType = getFileType(file);

  if (!fileType) {
    throw new Error(`Tiedostotyyppiä ei tueta: ${file.name}`);
  }

  logger.info(`Converting ${file.name} (${fileType}) to markdown...`);

  switch (fileType) {
    case 'pdf': {
      const arrayBuffer = await file.arrayBuffer();
      return convertPDFToMarkdown(arrayBuffer);
    }

    case 'txt':
    case 'md': {
      const text = await file.text();
      return convertTextToMarkdown(text);
    }

    default:
      throw new Error(`Tiedostotyyppiä ei tueta: ${fileType}`);
  }
}

/**
 * Validate if file is supported
 */
export function isSupportedFileType(file: File): boolean {
  return getFileType(file) !== null;
}

/**
 * Get list of supported file extensions for input[type="file"] accept attribute
 */
export function getSupportedFileExtensions(): string {
  return '.pdf,.txt,.md';
}
