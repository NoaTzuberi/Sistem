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
      recomp: { type: Number },
      muscle_gain: { type: Number },
      maintenance: { type: Number },
    },
    activityFactors: { type: [Number], default: undefined },
    floorKcal: { type: Number },
  },
  { timestamps: true },
);

export const NutritionSettings = model<NutritionSettingsDocument>('NutritionSettings', nutritionSettingsSchema);
