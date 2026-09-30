import type { ReactNode } from 'react';
import { GlassCard } from '../../../../components/common/GlassCard/GlassCard';
import { Logo } from '../../../../components/common/Logo/Logo';
import './AuthCard.css';

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <GlassCard className="auth-card">
      <Logo size="lg" className="auth-card-logo" />
      <h1 className="auth-card-title">{title}</h1>
      {children}
    </GlassCard>
  );
}
