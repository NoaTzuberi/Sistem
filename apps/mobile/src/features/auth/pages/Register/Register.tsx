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
import { validateName, validateEmail, validatePassword } from '../../validation';
import { ROUTES } from '../../../../app/config/routes';
import './Register.css';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    const nextNameError = validateName(name);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextNameError || nextEmailError || nextPasswordError) return;

    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      navigate(ROUTES.ONBOARDING);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Registration failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <Section className="auth-page">
        <Container>
          <AuthCard title="Create Account">
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <Input
                type="text"
                label="Name"
                placeholder="Your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={nameError}
                autoComplete="name"
              />
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
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={passwordError}
                autoComplete="new-password"
              />
              {formError && <p className="auth-form-error">{formError}</p>}
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Create Account
              </Button>
            </form>
            <p className="auth-switch">
              Already have an account? <Link to={ROUTES.LOGIN}>Log In</Link>
            </p>
          </AuthCard>
        </Container>
      </Section>
    </PageLayout>
  );
}
