type UploadInvoicePdfResponse = {
  pdfUrl: string;
  pdfPublicId: string;
};

async function parseError(response: Response) {
  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    return parsed.error?.message || raw;
  } catch {
    return raw;
  }
}

export const uploadInvoicePdf = async (file: File, invoiceNumber: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('invoiceNumber', invoiceNumber);

  const response = await fetch('/api/invoices/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as UploadInvoicePdfResponse;
};
