import { describe, expect, it, vi } from 'vitest';
import { pdfImportErrorMessage } from './errors';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn()
}));

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: 'pdf.worker.test.mjs'
}));

const { GlobalWorkerOptions } = await import('pdfjs-dist');
await import('./pdfjs');

describe('PDF.js configuration', () => {
  it('configures the worker before the first document is opened', () => {
    expect(GlobalWorkerOptions.workerSrc).toContain('pdf.worker');
  });

  it('does not blame a valid file for an unexpected reader setup failure', () => {
    expect(pdfImportErrorMessage(new Error('Worker source missing'))).toMatch(
      /reader could not start/i
    );
  });

  it('retains a specific message for structurally invalid PDFs', () => {
    const error = new Error('Invalid PDF structure');
    error.name = 'InvalidPDFException';
    expect(pdfImportErrorMessage(error)).toMatch(/not a readable PDF/i);
  });
});
