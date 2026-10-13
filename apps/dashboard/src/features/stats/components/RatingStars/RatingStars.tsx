import { useId } from 'react';
import './RatingStars.css';

interface RatingStarsProps {
  /** 0–`max`; a fraction fills part of a star. null = no rating yet (empty stars). */
  value: number | null;
  max: number;
}

const STAR = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';

/** A rating as stars; 4.6 fills four stars and 60% of the fifth. Decorative — the number is written under it. */
export function RatingStars({ value, max }: RatingStarsProps) {
  const id = useId();
  return (
    <span className="rating-stars" aria-hidden="true">
      {Array.from({ length: max }, (_, index) => {
        const filled = Math.max(0, Math.min(1, (value ?? 0) - index));
        return (
          <svg key={index} className="rating-star" viewBox="0 0 24 24">
            <defs>
              {/* Both stops at the same place: a hard edge where the filled part ends. */}
              <linearGradient id={`${id}-${index}`}>
                <stop className="rating-star-on" offset={filled} />
                <stop className="rating-star-off" offset={filled} />
              </linearGradient>
            </defs>
            <path d={STAR} fill={`url(#${id}-${index})`} />
          </svg>
        );
      })}
    </span>
  );
}
