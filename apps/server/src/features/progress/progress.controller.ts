import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validateProgressPayload, validateListQuery } from './progress.validation';
import { createProgressEntry, listProgressEntries } from './progress.service';

export async function postProgressEntry(req: AuthenticatedRequest, res: Response) {
  const validationError = validateProgressPayload(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const entry = await createProgressEntry(req.userId!, req.body);
  res.status(201).json({ entry });
}

export async function getProgressEntries(req: AuthenticatedRequest, res: Response) {
  const validationError = validateListQuery(req.query);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const entries = await listProgressEntries(req.userId!, limit);
  res.status(200).json({ items: entries });
}
