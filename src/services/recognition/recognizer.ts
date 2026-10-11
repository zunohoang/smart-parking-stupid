import { normalizePlate } from '../../utils/plate';
export interface RecognitionResult {
  rawText: string;
  normalizedPlate: string;
  source: 'DEMO' | 'OCR';
  message: string;
}
export interface LicensePlateRecognizer {
  recognize(imageUri: string | null, samplePlate?: string): Promise<RecognitionResult>;
}
export class DemoLicensePlateRecognizer implements LicensePlateRecognizer {
  async recognize(
    _imageUri: string | null,
    samplePlate = '59-X1 123.45',
  ): Promise<RecognitionResult> {
    return {
      rawText: samplePlate,
      normalizedPlate: normalizePlate(samplePlate),
      source: 'DEMO',
      message: 'Nhận diện mô phỏng — vui lòng đối chiếu và sửa biển số.',
    };
  }
}
// Replace with an OCR service/native implementation without changing scanner UI.
export const recognizer: LicensePlateRecognizer = new DemoLicensePlateRecognizer();
