export function pdfImportErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'PasswordException') {
      return 'Password-protected PDFs are not supported yet.';
    }
    if (error.name === 'InvalidPDFException' || error.name === 'MissingPDFException') {
      return 'The selected file is not a readable PDF.';
    }
  }

  return 'The PDF reader could not start. Reload the app and try again.';
}
