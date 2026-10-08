import { Response } from 'express';
import type { FormulaSex, NutritionGoal, NutritionIssuesBody } from '@sistem/types';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getNutritionFeatures } from '../../config/features';
import {
  FoodItemNotFoundError,
  FoodItemValidationError,
  countFoodsAboveCaps,
  createCoachFood,
  deleteCoachFood,
  listCoachFoods,
  restoreCoachFood,
  updateCoachFood,
} from './foodItem.service';
import { NutritionSettingsConflictError, getNutritionSettings, saveNutritionSettings } from './nutritionSettings.service';
import {
  NutritionPlanConflictError,
  NutritionPlanNotFoundError,
  NutritionPlanValidationError,
  applyNutritionTemplate,
  createNutritionTemplateFromPlan,
  deleteNutritionTemplate,
  getCalorieSuggestion,
  getCoachNutritionPlan,
  getTraineeNutritionPlan,
  listNutritionTemplates,
  publishCoachNutritionPlan,
  saveCoachNutritionPlan,
} from './nutritionPlan.service';
import {
  parseApplyNutritionTemplatePayload,
  parseCreateNutritionTemplatePayload,
  parseFoodItemPayload,
  parseNutritionSettingsPayload,
  parseSaveNutritionPlanPayload,
  validateIdParam,
} from './nutrition.validation';
import { FORMULA_SEX_IDS, NUTRITION_GOAL_IDS } from './nutrition.constants';

/** Answers the request for a known nutrition error; anything else is rethrown (500). */
function sendNutritionError(res: Response, error: unknown): void {
  if (error instanceof FoodItemNotFoundError || error instanceof NutritionPlanNotFoundError) {
    res.status(404).json({ message: error.message });
    return;
  }
  if (error instanceof NutritionPlanValidationError) {
    const body: NutritionIssuesBody = { message: error.message, issues: error.issues };
    res.status(400).json(body);
    return;
  }
  if (error instanceof FoodItemValidationError) {
    res.status(400).json({ message: error.message });
    return;
  }
  if (error instanceof NutritionPlanConflictError || error instanceof NutritionSettingsConflictError) {
    res.status(409).json({ message: error.message });
    return;
  }
  throw error;
}

/** A route param id, or null after answering 400. */
function readId(req: AuthenticatedRequest, res: Response, param: string, label: string): string | null {
  const error = validateIdParam(req.params[param], label);
  if (error) {
    res.status(400).json({ message: error });
    return null;
  }
  return String(req.params[param]);
}

// --- Food list (coach) -------------------------------------------------------

export async function getFoods(req: AuthenticatedRequest, res: Response) {
  res.status(200).json({ items: await listCoachFoods(req.userId!) });
}

export async function postFood(req: AuthenticatedRequest, res: Response) {
  const { value, error } = parseFoodItemPayload(req.body, false);
  if (!value) {
    res.status(400).json({ message: error });
    return;
  }
  try {
    res.status(201).json({ item: await createCoachFood(req.userId!, value) });
  } catch (createError) {
    sendNutritionError(res, createError);
  }
}

export async function patchFood(req: AuthenticatedRequest, res: Response) {
  const foodId = readId(req, res, 'foodId', 'food item');
  if (!foodId) return;
  const { value, error } = parseFoodItemPayload(req.body, true);
  if (!value) {
    res.status(400).json({ message: error });
    return;
  }
  try {
    res.status(200).json({ item: await updateCoachFood(req.userId!, foodId, value) });
  } catch (updateError) {
    sendNutritionError(res, updateError);
  }
}

export async function deleteFood(req: AuthenticatedRequest, res: Response) {
  const foodId = readId(req, res, 'foodId', 'food item');
  if (!foodId) return;
  try {
    res.status(200).json(await deleteCoachFood(req.userId!, foodId));
  } catch (error) {
    sendNutritionError(res, error);
  }
}

export async function postRestoreFood(req: AuthenticatedRequest, res: Response) {
  const foodId = readId(req, res, 'foodId', 'food item');
  if (!foodId) return;
  try {
    res.status(200).json({ item: await restoreCoachFood(req.userId!, foodId) });
  } catch (error) {
    sendNutritionError(res, error);
  }
}

// --- Settings (coach) ---------------------------------------------------------

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await getNutritionSettings(req.userId!));
}

export async function putSettings(req: AuthenticatedRequest, res: Response) {
  const { value, error } = parseNutritionSettingsPayload(req.body);
  if (!value) {
    res.status(400).json({ message: error });
    return;
  }
  try {
    res.status(200).json(await saveNutritionSettings(req.userId!, value, (caps) => countFoodsAboveCaps(req.userId!, caps)));
  } catch (saveError) {
    sendNutritionError(res, saveError);
  }
}

// --- Templates (coach) --------------------------------------------------------

export async function getTemplates(req: AuthenticatedRequest, res: Response) {
  res.status(200).json({ items: await listNutritionTemplates(req.userId!) });
}

export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
  const templateId = readId(req, res, 'templateId', 'template');
  if (!templateId) return;
  try {
    await deleteNutritionTemplate(req.userId!, templateId);
    res.status(204).end();
  } catch (error) {
    sendNutritionError(res, error);
  }
}

// --- A trainee's plan (coach; after loadCoachTrainee) -----------------------------

export async function getTraineeNutrition(req: AuthenticatedRequest, res: Response) {
  res.status(200).json(await getCoachNutritionPlan(req.traineeId!, req.userId!));
}

export async function getTraineeCalorieSuggestion(req: AuthenticatedRequest, res: Response) {
  const { goal, formula } = req.query;
  if (goal !== undefined && !(NUTRITION_GOAL_IDS as readonly unknown[]).includes(goal)) {
    res.status(400).json({ message: 'Unknown goal.' });
    return;
  }
  if (formula !== undefined && !(FORMULA_SEX_IDS as readonly unknown[]).includes(formula)) {
    res.status(400).json({ message: 'The formula must be male or female.' });
    return;
  }
  res.status(200).json(
    await getCalorieSuggestion(req.traineeId!, req.userId!, {
      goal: (goal as NutritionGoal | undefined) ?? null,
      formulaSex: (formula as FormulaSex | undefined) ?? null,
    }),
  );
}

export async function putTraineeNutrition(req: AuthenticatedRequest, res: Response) {
  const { value, issues } = parseSaveNutritionPlanPayload(req.body, getNutritionFeatures());
  if (!value) {
    const body: NutritionIssuesBody = { message: issues[0].message, issues };
    res.status(400).json(body);
    return;
  }
  try {
    res.status(200).json(await saveCoachNutritionPlan(req.traineeId!, req.userId!, value));
  } catch (error) {
    sendNutritionError(res, error);
  }
}

export async function postPublishTraineeNutrition(req: AuthenticatedRequest, res: Response) {
  try {
    res.status(200).json(await publishCoachNutritionPlan(req.traineeId!, req.userId!));
  } catch (error) {
    sendNutritionError(res, error);
  }
}

export async function postTraineeNutritionFromTemplate(req: AuthenticatedRequest, res: Response) {
  const { value, error } = parseApplyNutritionTemplatePayload(req.body);
  if (!value) {
    res.status(400).json({ message: error });
    return;
  }
  try {
    res.status(200).json(await applyNutritionTemplate(req.traineeId!, req.userId!, value.templateId));
  } catch (applyError) {
    sendNutritionError(res, applyError);
  }
}

export async function postTraineeNutritionTemplate(req: AuthenticatedRequest, res: Response) {
  const { value, error } = parseCreateNutritionTemplatePayload(req.body);
  if (!value) {
    res.status(400).json({ message: error });
    return;
  }
  try {
    res.status(201).json({ template: await createNutritionTemplateFromPlan(req.traineeId!, req.userId!, value) });
  } catch (createError) {
    sendNutritionError(res, createError);
  }
}

// --- Trainee ----------------------------------------------------------------------

/** Her newest published version — no calorie numbers. */
export async function getMyNutritionPlan(req: AuthenticatedRequest, res: Response) {
  res.status(200).json({ plan: await getTraineeNutritionPlan(req.userId!), features: getNutritionFeatures() });
}
