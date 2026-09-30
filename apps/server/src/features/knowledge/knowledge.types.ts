import type { Types } from 'mongoose';
import type { KnowledgeType } from './knowledge.constants';

export interface KnowledgeChunkMetadata {
  type: KnowledgeType;
  source: string;
  exerciseId: Types.ObjectId | null;
}

export interface KnowledgeChunkDocument {
  content: string;
  embedding: number[];
  metadata: KnowledgeChunkMetadata;
  createdAt: Date;
}
