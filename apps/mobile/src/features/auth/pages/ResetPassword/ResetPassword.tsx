import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../../../../components/layout/PageLayout/PageLayout';
import { Container } from '../../../../components/layout/Container/Container';
import { Section } from '../../../../components/layout/Section/Section';
import { Input } from '../../../../components/common/Input/Input';
import { Button } from '../../../../components/common/Button/Button';
import { AuthCard } from '../../components/AuthCard/AuthCard';
import { resetPassword } from '../../../../services/auth/authService';
import { validatePassword, validateConfirmPassword } from '../../validation';
import { ROUTES } from '../../../../app/config/routes';
import './ResetPassword.css';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    const nextPasswordError = validatePassword(password);
    const nextConfirmPasswordError = validateConfirmPassword(password, confirmPassword);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);

    if (nextPasswordError || nextConfirmPasswordError) return;

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsDone(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <PageLayout>
        <Section className="auth-page">
          <Container>
            <AuthCard title="Reset Password">
              <p className="reset-password-message">
                This reset link is missing or invalid. Request a new one to continue.
              </p>
              <p className="auth-switch">
                <Link to={ROUTES.FORGOT_PASSWORD}>Request a new link</Link>
              </p>
            </AuthCard>
          </Container>
        </Section>
      </PageLayout>
    );
  }

  if (isDone) {
    return (
      <PageLayout>
        <Section className="auth-page">
          <Container>
            <AuthCard title="Reset Password">
              <p className="reset-password-message">Your password has been reset.</p>
              <Button variant="primary" onClick={() => navigate(ROUTES.LOGIN)}>
                Log In
              </Button>
            </AuthCard>
          </Container>
        </Section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Section className="auth-page">
        <Container>
          <AuthCard title="Reset Password">
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <Input
                type="password"
                label="New Password"
                placeholder="Enter a new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={passwordError}
                autoComplete="new-password"
              />
              <Input
                type="password"
                label="Confirm Password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={confirmPasswordError}
                autoComplete="new-password"
              />
              {formError && <p className="auth-form-error">{formError}</p>}
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Reset Password
              </Button>
            </form>
            <p className="auth-switch">
              <Link to={ROUTES.LOGIN}>Back to Log In</Link>
            </p>
          </AuthCard>
        </Container>
      </Section>
    </PageLayout>
  );
}
