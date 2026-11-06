// Clinical section headers, bilingual like the paper file (D13).
// Each entry: [English, Arabic].

export const SECTIONS = {
  patientData: ['Patient Data', 'بيانات المريضة'],
  history: ['History', 'التاريخ المرضي'],
  obstetricHistory: ['Obstetric History', 'التاريخ التوليدي'],
  ultrasounds: ['Ultrasounds', 'الموجات فوق الصوتية'],
  visits: ['Antenatal Visits', 'زيارات متابعة الحمل'],
  followUps: ['Follow-up Visits', 'زيارات المتابعة'],
  labs: ['Laboratory', 'التحاليل'],
  delivery: ['Delivery Data', 'بيانات الولادة'],
  postnatal: ['Postnatal Visit', 'زيارة ما بعد الولادة'],
  semenAnalysis: ['Semen Analysis', 'تحليل السائل المنوي'],
  medications: ['Medications', 'الأدوية'],
} as const;

export type SectionKey = keyof typeof SECTIONS;

export const MODULE_LABELS: Record<string, [string, string]> = {
  OBS: ['Obstetrics', 'متابعة الحمل'],
  GYN: ['Gynecology', 'أمراض النساء'],
  ICSI: ['ICSI / IVF', 'الحقن المجهري'],
};
