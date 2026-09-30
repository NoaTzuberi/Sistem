/**
 * Additive to the originally documented "exercise | training | recovery"
 * (docs/04_DATABASE_SCHEMA.md). Exercise knowledge is NOT embedded here — the
 * agent reads it directly from the existing Exercise collection via tools,
 * since it's already-structured data with 2,900+ real entries. This
 * collection instead holds the hand-written knowledge docs from
 * docs/06_RAG_KNOWLEDGE_PLAN.md categories 2-6, split into four practical
 * buckets: training principles, programming, recovery (including
 * injury-aware modifications), and coaching style.
 */
export const KNOWLEDGE_TYPE_IDS = ['training', 'programming', 'recovery', 'coaching'] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPE_IDS)[number];
