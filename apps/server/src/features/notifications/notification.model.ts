import { Schema, model } from 'mongoose';
import { NOTIFICATION_TYPE_IDS } from './notification.constants';
import type { NotificationDocument } from './notification.types';

const notificationSchema = new Schema<NotificationDocument>(
  {
    // The recipient. Every query is scoped by this — a user only ever sees her own.
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPE_IDS, required: true },
    // Shape depends on `type` (NotificationPayload). Typed in notify(), not by Mongoose.
    data: { type: Schema.Types.Mixed, required: true },
    // Idempotency: the same event never creates two notifications for one user,
    // e.g. 'trainee_onboarded:<traineeId>', 'plan_published:<planId>'.
    dedupeKey: { type: String, required: true, trim: true },
    // null = unread
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
// The list: newest first, paged by id.
notificationSchema.index({ userId: 1, _id: -1 });
// The unread count.
notificationSchema.index({ userId: 1, readAt: 1 });

export const Notification = model<NotificationDocument>('Notification', notificationSchema);
