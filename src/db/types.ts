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
  pregnancy: {
    lmpDate: string | null;
    eddDate: string | null;
    gravida: number | null;
    parity: number | null;
    abortions: number | null;
    deliveryDate: string | null;
    deliveryMode: string | null;
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
}
