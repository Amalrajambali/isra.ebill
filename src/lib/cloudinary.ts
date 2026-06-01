const getCloudinaryConfig = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
    );
  }

  return { cloudName, uploadPreset };
};

type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
};

export const uploadInvoicePdf = async (file: File, invoiceNumber: string) => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = await response.text();

    try {
      const parsed = JSON.parse(errorMessage) as { error?: { message?: string } };
      errorMessage = parsed.error?.message || errorMessage;
    } catch {
      // Keep the raw text response when it is not JSON.
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as CloudinaryUploadResponse;
  if (!data.secure_url) {
    throw new Error('Cloudinary upload did not return a public URL.');
  }

  return {
    pdfUrl: data.secure_url,
    pdfPublicId: data.public_id,
  };
};
