import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '../../../../components/layout/PageLayout/PageLayout';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { Input } from '../../../../components/common/Input/Input';
import { Button } from '../../../../components/common/Button/Button';
import { AuthCard } from '../../components/AuthCard/AuthCard';
import { useAuth } from '../../../../services/auth/AuthContext';
import { validateEmail, validateLoginPassword } from '../../validation';
import { ROUTES } from '../../../../app/config/routes';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    const nextEmailError = validateEmail(email);
    const nextPasswordError = validateLoginPassword(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      await login({ email, password });
      // "/" sends the user to the landing screen for their server-decided state.
      navigate(ROUTES.HOME);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <Section className="auth-page">
        <Container>
          <AuthCard title="Log In">
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={emailError}
                autoComplete="email"
              />
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={passwordError}
                autoComplete="current-password"
              />
              <Link to={ROUTES.FORGOT_PASSWORD} className="login-forgot-password">
                Forgot password?
              </Link>
              {formError && <p className="auth-form-error">{formError}</p>}
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Log In
              </Button>
            </form>
            <p className="auth-switch">
              Don&apos;t have an account? <Link to={ROUTES.REGISTER}>Register</Link>
            </p>
          </AuthCard>
        </Container>
      </Section>
    </PageLayout>
  );
}
