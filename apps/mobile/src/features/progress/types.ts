export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  legs?: number;
}

export interface ProgressEntry {
  id: string;
  date: string;
  weight?: number;
  bodyMeasurements?: BodyMeasurements;
  notes?: string;
}

export interface ProgressEntryInput {
  date?: string;
  weight?: number;
  bodyMeasurements?: BodyMeasurements;
  notes?: string;
}
