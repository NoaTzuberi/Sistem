import { Schema, model } from 'mongoose';
import { DIET_TAG_IDS, FOOD_GROUP_IDS } from './nutrition.constants';
import type { FoodItemDocument } from './nutrition.types';

// The coach's food list (PRD §5.6): exchange-list items, one portion each. Names and
// portions are stored exactly as she writes them (Hebrew) — never translated. An item a
// plan, version or template uses is archived, never deleted.
const foodItemSchema = new Schema<FoodItemDocument>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: String, enum: FOOD_GROUP_IDS, required: true },
    name: { type: String, required: true, trim: true },
    portion: { type: String, required: true, trim: true },
    // Eggs, slices and spoons have no grams.
    grams: { type: Number, min: 0, default: null },
    // Optional; never above the group's value (checked in the service — the cap is per coach).
    kcal: { type: Number, min: 0, default: null },
    // The guide's "new" tag (API: isNew — a reserved Mongoose path name).
    isNewItem: { type: Boolean, default: false },
    dietTags: { type: [{ type: String, enum: DIET_TAG_IDS }], default: [] },
    order: { type: Number, default: 0 },
    archivedAt: { type: Date, default: null },
    seedKey: { type: String, default: undefined },
  },
  { timestamps: true },
);

foodItemSchema.index({ coachId: 1, group: 1, archivedAt: 1, order: 1 });
foodItemSchema.index(
  { coachId: 1, seedKey: 1 },
  { unique: true, partialFilterExpression: { seedKey: { $type: 'string' } } },
);

export const FoodItem = model<FoodItemDocument>('FoodItem', foodItemSchema);
