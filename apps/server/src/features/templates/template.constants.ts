export const TEMPLATE_TYPE_IDS = ['workout', 'plan'] as const;
export type TemplateType = (typeof TEMPLATE_TYPE_IDS)[number];
