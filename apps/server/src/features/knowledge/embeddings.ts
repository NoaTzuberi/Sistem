import { config } from '../../config/env';

const VOYAGE_EMBEDDINGS_URL = 'https://api.voyageai.com/v1/embeddings';
const EMBEDDING_MODEL = 'voyage-3.5';

export class EmbeddingsNotConfiguredError extends Error {}

interface VoyageEmbeddingsResponse {
  data: Array<{ embedding: number[]; index: number }>;
}

/**
 * input_type distinguishes indexing text (documents, embedded once at seed
 * time) from a live user question (query, embedded per request) — Voyage
 * optimizes each differently for retrieval accuracy.
 */
async function embed(texts: string[], inputType: 'document' | 'query'): Promise<number[][]> {
  if (!config.voyageApiKey) {
    throw new EmbeddingsNotConfiguredError(
      'VOYAGE_API_KEY is not configured. Add it to server/.env to enable RAG retrieval.',
    );
  }

  const response = await fetch(VOYAGE_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.voyageApiKey}`,
    },
    body: JSON.stringify({ input: texts, model: EMBEDDING_MODEL, input_type: inputType }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage embeddings request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as VoyageEmbeddingsResponse;
  return [...data.data].sort((a, b) => a.index - b.index).map((entry) => entry.embedding);
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  return embed(texts, 'document');
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embed([text], 'query');
  return embedding;
}
