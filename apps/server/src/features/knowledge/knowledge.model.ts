import { Schema, model } from 'mongoose';
import { KNOWLEDGE_TYPE_IDS } from './knowledge.constants';
import type { KnowledgeChunkDocument, KnowledgeChunkMetadata } from './knowledge.types';

const metadataSchema = new Schema<KnowledgeChunkMetadata>(
  {
    type: { type: String, enum: KNOWLEDGE_TYPE_IDS, required: true },
    source: { type: String, required: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', default: null },
  },
  { _id: false },
);

const knowledgeChunkSchema = new Schema<KnowledgeChunkDocument>({
  content: { type: String, required: true },
  embedding: { type: [Number], required: true },
  metadata: { type: metadataSchema, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

knowledgeChunkSchema.index({ 'metadata.type': 1 });

export const KnowledgeChunk = model<KnowledgeChunkDocument>('KnowledgeChunk', knowledgeChunkSchema);
