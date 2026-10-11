import type { ImgHTMLAttributes } from 'react';
import logoPink from '@sistem/tokens/brand/sistem_logo_horizontal_pink.png';
import logoOnBrand from '@sistem/tokens/brand/sistem_logo_horizontal_transparent.png';
import logoMark from '@sistem/tokens/brand/sistem_mark_transparent.png';
import './Logo.css';

export type LogoSize = 'md' | 'lg';
/** `full`: the horizontal logo on its pink block. `mark`: the kettlebell-heart only.
 * `onBrand`: the transparent horizontal logo — ONLY on the pink brand gradient (login /
 * sign-up); its near-white "SIS" disappears on the light app background. */
export type LogoVariant = 'full' | 'mark' | 'onBrand';

interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  size?: LogoSize;
  variant?: LogoVariant;
}

const SOURCES: Record<LogoVariant, string> = { full: logoPink, mark: logoMark, onBrand: logoOnBrand };

// The only place the brand mark lives (files in packages/tokens/brand, copied from
// the owner's brand/ folder). Swap the files there and every screen follows.
export function Logo({ size = 'md', variant = 'full', className, ...rest }: LogoProps) {
  const classNames = ['logo', `logo-${variant}`, `logo-${size}`, className].filter(Boolean).join(' ');

  // The brand name stays as it is in every language (owner, Phase 15). i18n-ignore
  return <img className={classNames} src={SOURCES[variant]} alt="Sistem" {...rest} />;
}
