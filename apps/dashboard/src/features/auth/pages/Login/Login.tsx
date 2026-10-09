import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../services/auth/AuthContext';
import { ROUTES } from '../../../../app/config/routes';
import { Logo } from '../../../../components/common/Logo/Logo';
import { LanguageSwitch } from '../../../../components/common/LanguageSwitch/LanguageSwitch';
import { useCopy } from '@sistem/shared';
import { appCopy } from '../../../../copy';
import './Login.css';

// Placeholder copy and layout — the owner designs the real dashboard login.
export function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const copy = useCopy(appCopy);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user?.role === 'coach') {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    try {
      const loggedInUser = await login({ email, password });
      // The dashboard is coach-only. The server enforces this on every coach
      // endpoint too; this only keeps trainees out of an empty UI.
      if (loggedInUser.role !== 'coach') {
        logout();
        setError(copy.coachOnly);
        return;
      }
      navigate(ROUTES.HOME, { replace: true });
    } catch (loginError) {
      setError((loginError instanceof Error && loginError.message) || copy.loginFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <Logo size="lg" className="login-logo" />
        <h1 className="login-title">{copy.loginTitle}</h1>

        <label className="login-field">
          <span className="login-label">{copy.email}</span>
          <input
            className="login-input"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="login-field">
          <span className="login-label">{copy.password}</span>
          <input
            className="login-input"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button className="login-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? copy.loggingIn : copy.logIn}
        </button>

        {/* Before login the device remembers the choice; after login her saved language wins (Phase 15). */}
        <LanguageSwitch />
      </form>
    </main>
  );
}
