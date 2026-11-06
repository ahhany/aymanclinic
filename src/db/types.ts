// DTOs matching server/handler.ts responses.

export interface RegistryPatient {
  id: string;
  patientCode: string;
  fullName: string;
  mobile: string | null;
  modules: string[];
  openEpisodes: number;
}

export interface TestDefinitionDto {
  testCode: string;
  testName: string;
  defaultUnit: string | null;
  refLow: number | null;
  refHigh: number | null;
  panel: string | null;
}

export interface LabResultDto {
  id: string;
  testCode: string;
  testName: string;
  resultValue: number | null;
  unit: string | null;
  abnormalFlag: string | null;
}

export interface LabReportDto {
  id: string;
  reportDate: string;
  laboratoryName: string | null;
  results: LabResultDto[];
}

export interface VisitDto {
  id: string;
  visitDate: string;
  weightKg: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  ultrasoundNote: string | null;
  complaints: string | null;
  management: string | null;
  nextVisit: string | null;
  nextVisitDate: string | null;
  location: string | null;
}

export interface DiagnosisDto {
  id: string;
  label: string;
  code: string | null;
  status: string;
  diagnosedAt: string;
}

export interface AppointmentDto {
  id: string;
  scheduledAt: string;
  status: string;
  location: string | null;
  reason: string | null;
}

export interface MedicationDto {
  id: string;
  brandName: string;
  activeIngredient: string;
  form: string | null;
  strength: string | null;
  prescriptionCount: number;
}

export interface UltrasoundMilestoneDto {
  id: string;
  type: string;
  scanDate: string | null;
  operator: string | null;
  place: string | null;
  payloadJson: string;
}

export interface ObstetricHistoryRowDto {
  id: string;
  year: number | null;
  duration: string | null;
  pregnancyNote: string | null;
  complications: string | null;
  deliveryMode: string | null;
  postPartum: string | null;
}

export interface SemenAnalysisDto {
  id: string;
  labName: string | null;
  analysisDate: string | null;
  countMPerMl: number | null;
  motilityAPct: number | null;
  motilityBPct: number | null;
  motilityCPct: number | null;
  motilityDPct: number | null;
  abnormalFormsPct: number | null;
}

export interface PrescriptionDto {
  id: string;
  prescriptionDate: string;
  dose: string | null;
  frequency: string | null;
  indication: string | null;
  medication: { brandName: string; strength: string | null; activeIngredient: string };
}

export interface EpisodeDto {
  id: string;
  type: 'OBS' | 'GYN' | 'ICSI' | string;
  status: string;
  location: string | null;
  pregnancy: {
    lmpDate: string | null;
    eddDate: string | null;
    gravida: number | null;
    parity: number | null;
    abortions: number | null;
    deliveryDate: string | null;
    hospital: string | null;
    deliveryMode: string | null;
    anesthesia: string | null;
    maternalComplications: string | null;
    fetalComplications: string | null;
    fetalSex: string | null;
    postnatalDate: string | null;
    postnatalPayment: string | null;
    postnatalScar: string | null;
    postnatalComplications: string | null;
    postnatalFollowupTtt: string | null;
  } | null;
  gyn: {
    marriedFor: string | null;
    contraception: string | null;
    menstrualHistory: string | null;
    remarks: string | null;
  } | null;
  visits: VisitDto[];
  semenAnalyses: SemenAnalysisDto[];
  prescriptions: PrescriptionDto[];
  diagnoses: DiagnosisDto[];
  ultrasounds: UltrasoundMilestoneDto[];
}

export interface PatientDetailDto {
  id: string;
  patientCode: string;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  rhType: string | null;
  pastHistory: string | null;
  familyHistory: string | null;
  identity: { fullName: string; mobile: string | null; address: string | null; husbandName: string | null } | null;
  episodes: EpisodeDto[];
  labReports: LabReportDto[];
  appointments: AppointmentDto[];
  obstetricHistory: ObstetricHistoryRowDto[];
}
