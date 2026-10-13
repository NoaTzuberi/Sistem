import { Request, Response } from 'express';

// The host's health check (render.yaml) and the "is the server awake" test. No database call:
// it must answer as soon as the process listens.
export function getHealth(req: Request, res: Response) {
  res.json({ ok: true });
}
