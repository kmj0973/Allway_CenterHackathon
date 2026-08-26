export interface AftercareHomeResponse {
  caseId: number;
  patientName: string;
  aftercareProgress: {
    elapsedDays: number;
    totalCareDays: number;
  };
  procedure: {
    procedureName: string;
    procedureDate: string;
  };
  consultationAppointment: {
    appointmentId: number;
    startsAt: string;
  } | null;
}

export type RecoveryGuideStatus = "PAST" | "CURRENT" | "UPCOMING";

export interface AftercareDashboardResponse {
  caseId: number;
  caseStatus: {
    procedureName: string;
    procedureDate: string;
    currentDay: number;
    totalCareDays: number;
  };
  recoveryGuides: {
    stageGuideId: number;
    recoveryStage: string;
    startDay: number;
    endDay: number | null;
    guideItems: string[];
    status: RecoveryGuideStatus;
  }[];
  redFlags: {
    items: string[];
  };
}

export interface EmergencyMedicalReportResponse {
  caseId: number;
  patient: {
    name: string;
    englishName: string;
    displayName: string;
    birthDate: string;
    genderDisplayName: string;
  };
  procedure: {
    procedureDate: string;
    procedureName: string;
    procedureEnglishName: string;
    procedureDisplayName: string;
    /** 줄바꿈(\n)으로 구분된 문자열 */
    materials: string;
  };
  medicationAndAllergies: {
    /** 줄바꿈(\n)으로 구분된 문자열 */
    medications: string;
    allergies: {
      allergyId: number;
      allergenName: string;
      allergenEnglishName: string;
      allergenDisplayName: string;
    }[];
  };
  emergencyContacts: {
    clinicPhoneNumber: string;
    guardianPhoneNumber: string;
  };
}
