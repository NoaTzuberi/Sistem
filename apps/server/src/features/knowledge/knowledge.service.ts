import { KnowledgeChunk } from './knowledge.model';
import { embedQuery } from './embeddings';
import type { KnowledgeType } from './knowledge.constants';

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

export interface RetrievedKnowledgeChunk {
  content: string;
  type: KnowledgeType;
  source: string;
  score: number;
}

const DEFAULT_TOP_K = 4;

interface KnowledgeChunkLeanDoc {
  content: string;
  embedding: number[];
  metadata: { type: KnowledgeType; source: string };
}

/**
 * Brute-force cosine similarity over every chunk — fine at this scale
 * (dozens of hand-written documents, not thousands), and avoids depending on
 * a vector-search-capable Atlas tier or a separate vector DB service.
 */
export async function retrieveRelevantKnowledge(
  query: string,
  topK = DEFAULT_TOP_K,
): Promise<RetrievedKnowledgeChunk[]> {
  const [queryEmbedding, chunks] = await Promise.all([
    embedQuery(query),
    KnowledgeChunk.find().select('content embedding metadata').lean<KnowledgeChunkLeanDoc[]>(),
  ]);

  return chunks
    .map((chunk) => ({
      content: chunk.content,
      type: chunk.metadata.type,
      source: chunk.metadata.source,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
