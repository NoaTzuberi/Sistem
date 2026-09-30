import { Progress } from './progress.model';
import type { BodyMeasurements } from './progress.types';

export interface ProgressInput {
  date?: string;
  weight?: number;
  bodyMeasurements?: BodyMeasurements;
  notes?: string;
}

export interface PublicProgressEntry {
  id: string;
  date: Date;
  weight?: number;
  bodyMeasurements?: BodyMeasurements;
  notes?: string;
}

function toPublicEntry(doc: {
  _id: unknown;
  date: Date;
  weight?: number;
  bodyMeasurements?: BodyMeasurements;
  notes?: string;
}): PublicProgressEntry {
  return {
    id: String(doc._id),
    date: doc.date,
    weight: doc.weight,
    bodyMeasurements: doc.bodyMeasurements,
    notes: doc.notes,
  };
}

export async function createProgressEntry(userId: string, input: ProgressInput): Promise<PublicProgressEntry> {
  const created = await Progress.create({
    userId,
    date: input.date ? new Date(input.date) : new Date(),
    weight: input.weight,
    bodyMeasurements: input.bodyMeasurements,
    notes: input.notes,
  });

  return toPublicEntry(created);
}

export async function listProgressEntries(userId: string, limit = 50): Promise<PublicProgressEntry[]> {
  const docs = await Progress.find({ userId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return docs.map(toPublicEntry);
}
