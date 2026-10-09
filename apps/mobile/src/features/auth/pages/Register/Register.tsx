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
import { authErrorText, validateName, validateEmail, validatePassword, type AuthErrorKey } from '../../validation';
import { useCopy } from '@sistem/shared';
import { authCopy } from '../../copy';
import { ROUTES } from '../../../../app/config/routes';
import './Register.css';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const copy = useCopy(authCopy);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState<AuthErrorKey>();
  const [emailError, setEmailError] = useState<AuthErrorKey>();
  const [passwordError, setPasswordError] = useState<AuthErrorKey>();
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
      setFormError((error instanceof Error && error.message) || copy.registerFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <Section className="auth-page">
        <Container>
          <AuthCard title={copy.registerTitle}>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <Input
                type="text"
                label={copy.name}
                placeholder={copy.namePlaceholder}
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={authErrorText(copy, nameError)}
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
              />
              <Input
                type="email"
                label={copy.email}
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={authErrorText(copy, emailError)}
                autoComplete="email"
              />
              <Input
                type="password"
                label={copy.password}
                placeholder={copy.newPasswordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={authErrorText(copy, passwordError)}
                autoComplete="new-password"
                enterKeyHint="go"
              />
              {formError && <p className="auth-form-error">{formError}</p>}
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {copy.registerButton}
              </Button>
            </form>
            <p className="auth-switch">
              {copy.haveAccount} <Link to={ROUTES.LOGIN}>{copy.loginLink}</Link>
            </p>
          </AuthCard>
        </Container>
      </Section>
    </PageLayout>
  );
}
