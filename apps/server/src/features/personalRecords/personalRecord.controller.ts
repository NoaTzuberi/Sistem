import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { listPersonalRecords } from './personalRecord.service';

const MIN_LIMIT = 1;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

export async function listMyPersonalRecords(req: AuthenticatedRequest, res: Response) {
  const rawLimit = req.query.limit;
  let limit = DEFAULT_LIMIT;

  if (rawLimit !== undefined) {
    const parsed = Number(rawLimit);
    if (!Number.isInteger(parsed) || parsed < MIN_LIMIT || parsed > MAX_LIMIT) {
      res.status(400).json({ message: `limit must be an integer between ${MIN_LIMIT} and ${MAX_LIMIT}.` });
      return;
    }
    limit = parsed;
  }

  const records = await listPersonalRecords(req.userId!, limit);
  res.status(200).json({ items: records });
}
