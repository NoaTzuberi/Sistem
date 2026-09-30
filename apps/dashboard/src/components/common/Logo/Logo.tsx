import type { ImgHTMLAttributes } from 'react';
import logoPink from '@sistem/tokens/brand/sistem_logo_horizontal_pink.png';
import logoMark from '@sistem/tokens/brand/sistem_mark_transparent.png';
import './Logo.css';

export type LogoSize = 'md' | 'lg';
/** `full`: the horizontal logo on its pink block. `mark`: the kettlebell-heart only.
 * The transparent full logos are not used: their near-white "SIS" disappears on the
 * light app background. */
export type LogoVariant = 'full' | 'mark';

interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  size?: LogoSize;
  variant?: LogoVariant;
}

const SOURCES: Record<LogoVariant, string> = { full: logoPink, mark: logoMark };

// Same component as apps/mobile (mirror it until a shared packages/ui exists). The
// logo files live once, in packages/tokens/brand — swap them there.
export function Logo({ size = 'md', variant = 'full', className, ...rest }: LogoProps) {
  const classNames = ['logo', `logo-${variant}`, `logo-${size}`, className].filter(Boolean).join(' ');

  return <img className={classNames} src={SOURCES[variant]} alt="Sistem" {...rest} />;
}
