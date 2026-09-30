import type { ReactNode } from 'react';
import './ProgressRing.css';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

export function ProgressRing({ progress, size = 64, strokeWidth = 5, className, children }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clamped);

  const classNames = ['progress-ring', className].filter(Boolean).join(' ');

  return (
    <div className={classNames} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="progress-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="progress-ring-content">{children}</div>}
    </div>
  );
}
