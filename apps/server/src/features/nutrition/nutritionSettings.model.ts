import { Schema, model } from 'mongoose';
import type { NutritionSettingsDocument } from './nutrition.types';

// A coach's own nutrition numbers. Unset fields fall back to DEFAULT_NUTRITION_CONFIG
// (nutrition.config.ts) — see getEffectiveNutritionConfig().
const nutritionSettingsSchema = new Schema<NutritionSettingsDocument>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    groupKcal: {
      protein: { type: Number },
      carb: { type: Number },
      fat: { type: Number },
    },
    goalAdjustments: {
      fat_loss: { type: Number },
      fat_loss_aggressive: { type: Number },
      recomp: { type: Number },
      muscle_gain: { type: Number },
      maintenance: { type: Number },
    },
    activityFactors: { type: [Number], default: undefined },
    floorKcal: { type: Number },
    kcalPerKg: { type: Number },
    maxLossRatePctPerWeek: { type: Number },
    maxGainRatePctPerWeek: { type: Number },
    maxDeficitPct: { type: Number },
    portionSplit: {
      protein: { type: Number },
      carb: { type: Number },
      fat: { type: Number },
    },
    ketoMaxCarbPortions: { type: Number },
    // One-time tag updates already applied to her food list (e.g. 'lactose_from_dairy'),
    // so re-running the seed never undoes her own edits.
    appliedTagBackfills: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const NutritionSettings = model<NutritionSettingsDocument>('NutritionSettings', nutritionSettingsSchema);
