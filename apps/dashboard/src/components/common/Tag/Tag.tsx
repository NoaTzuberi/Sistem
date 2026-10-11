import type { ReactNode } from 'react';
import './Tag.css';

/** accent = soft pink · solid = needs action now · quiet = outlined · neutral = grey. */
export type TagTone = 'accent' | 'solid' | 'quiet' | 'neutral';

interface TagProps {
  tone?: TagTone;
  children: ReactNode;
}

/** The dashboard's small pill label (status, days left, personal records). */
export function Tag({ tone = 'neutral', children }: TagProps) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}
