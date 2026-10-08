export const TEMPLATE_TYPE_IDS = ['workout', 'plan', 'nutrition_plan'] as const;
export type TemplateType = (typeof TEMPLATE_TYPE_IDS)[number];
