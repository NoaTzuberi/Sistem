import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES } from './privatePhoto.constants';
import { sendError, msg } from '../../i18n';

const parseRawPhoto = express.raw({ type: [...ACCEPTED_PHOTO_TYPES], limit: MAX_PHOTO_BYTES });

/**
 * Reads a photo sent as the raw request body (Content-Type image/jpeg|png|webp) into
 * req.body as a Buffer — no multipart parser needed for one file. Answers 413 / 415 as
 * JSON itself instead of Express's HTML error page.
 */
export function readPhotoBody(req: Request, res: Response, next: NextFunction): void {
  parseRawPhoto(req, res, (error?: unknown) => {
    if (error) {
      const tooLarge = (error as { type?: string }).type === 'entity.too.large';
      res.status(tooLarge ? 413 : 400).json({ message: tooLarge ? msg('photo_too_large') : "Couldn't read the photo." });
      return;
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      sendError(res, 415, 'photo_wrong_type');
      return;
    }
    next();
  });
}
