// DTOs for the /api/dashboards/* aggregates — mirrors server/dashboards.ts.

import type { GaBucketKey } from '../../lib/dashboards';

export interface AdminDashboardDto {
  today: { date: string; total: number; byStatus: Record<string, number> };
  week: Array<{ date: string; count: number }>;
  newPatientsPerMonth: Array<{ month: string; count: number }>;
  overdueFollowUps: {
    count: number;
    rows: Array<{
      patientId: string;
      patientCode: string;
      fullName: string;
      nextVisitDate: string;
      daysOverdue: number;
      episodeType: string;
    }>;
  };
  appointmentsPerLocation: Array<{ location: string | null; count: number }>;
}

export interface ClinicalDashboardDto {
  pregnancies: { total: number; unknown: number; buckets: Array<{ key: GaBucketKey; count: number }> };
  anemia: { severe: number; moderate: number; mild: number; normal: number; tested: number; totalPatients: number };
  bpFlags: {
    count: number;
    rows: Array<{
      patientId: string;
      patientCode: string;
      fullName: string;
      bpSystolic: number | null;
      bpDiastolic: number | null;
      visitDate: string;
    }>;
  };
  topDiagnoses: Array<{ label: string; count: number }>;
  deliveryModes: Array<{ mode: string; count: number }>;
}

export interface PrescribingDashboardDto {
  topMedications: Array<{ medicationId: string; brandName: string; activeIngredient: string; count: number }>;
  prescriptionsPerMonth: Array<{ month: string; count: number }>;
  topIndications: Array<{ text: string; count: number }>;
  library: { total: number; everPrescribed: number; percentPrescribed: number };
  totalPrescriptions: number;
}
