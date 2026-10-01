import { Schema, model } from 'mongoose';
import { planWorkoutSchema } from '../plans/planWorkout.schema';
import { TEMPLATE_TYPE_IDS } from './template.constants';
import type { TemplateDocument } from './template.types';

// The coach's reusable workouts and plans (PRD §6). Typed content — the same
// workout subschema as Plan — so a template copies into a plan as-is.
// Replaces the ATLAS WorkoutTemplate in Phase 6; routes arrive with the plan builder.
const templateSchema = new Schema<TemplateDocument>(
  {
    coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TEMPLATE_TYPE_IDS, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    workouts: { type: [planWorkoutSchema], default: [] },
  },
  { timestamps: true },
);

templateSchema.pre('validate', function checkTemplateShape() {
  if (this.type === 'workout' && this.workouts.length !== 1) {
    this.invalidate('workouts', 'A workout template holds exactly one workout.');
  }
  if (this.type === 'plan' && this.workouts.length === 0) {
    this.invalidate('workouts', 'A plan template needs at least one workout.');
  }
});

templateSchema.index({ coachId: 1, type: 1, updatedAt: -1 });

export const Template = model<TemplateDocument>('Template', templateSchema);
