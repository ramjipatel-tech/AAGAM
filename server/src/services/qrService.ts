import QRCode from 'qrcode';
import { CLIENT_URL } from '../config';

export async function generateDocumentQrCode(documentId: string): Promise<string> {
  const verificationUrl = `${CLIENT_URL}/verify?id=${encodeURIComponent(documentId)}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#0A192F',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('[QR GENERATION ERROR]', error);
    return '';
  }
}
