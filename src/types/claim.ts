export interface MedicalClaim {
  id: string;
  employeeName: string;
  clinicName: string;
  subTotal: number;
  gst: number;
  grandTotal: number;
  illnessSummary: string;
  claimDate: string; // YYYY-MM-DD
  category: string;
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
}

export type ClaimCategory = 
  | 'General Practitioner (GP)'
  | 'Specialist Care'
  | 'Dental Treatment'
  | 'Optical & Vision'
  | 'Health Screening'
  | 'Prescription & Pharmacy'
  | 'Emergency & Urgent Care'
  | 'Physiotherapy'
  | 'Other';

export const CLAIM_CATEGORIES: ClaimCategory[] = [
  'General Practitioner (GP)',
  'Specialist Care',
  'Dental Treatment',
  'Optical & Vision',
  'Health Screening',
  'Prescription & Pharmacy',
  'Emergency & Urgent Care',
  'Physiotherapy',
  'Other',
];

export const COMMON_ILLNESS_TEMPLATES = [
  'Acute upper respiratory tract infection (cough, fever, flu)',
  'Routine dental check-up & scaling',
  'Migraine and tension headache consultation',
  'Gastroenteritis (stomach flu, vomiting)',
  'Dermatological rash & prescribed topical cream',
  'Musculoskeletal strain & physical therapy',
  'Annual health screening blood panel',
  'Specialist cardiology follow-up & ECG',
];

export function isTotalAccurate(subTotal: number, gst: number, grandTotal: number): boolean {
  const expected = Math.round((subTotal + gst) * 100) / 100;
  const actual = Math.round(grandTotal * 100) / 100;
  return Math.abs(expected - actual) < 0.01;
}

export function getDiscrepancy(subTotal: number, gst: number, grandTotal: number): number {
  const expected = Math.round((subTotal + gst) * 100) / 100;
  const actual = Math.round(grandTotal * 100) / 100;
  return Math.round((actual - expected) * 100) / 100;
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currency}0.00`;
  return `${currency}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
