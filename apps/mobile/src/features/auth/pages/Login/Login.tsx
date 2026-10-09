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
import { authErrorText, validateEmail, validateLoginPassword, type AuthErrorKey } from '../../validation';
import { useCopy } from '@sistem/shared';
import { authCopy } from '../../copy';
import { ROUTES } from '../../../../app/config/routes';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const copy = useCopy(authCopy);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<AuthErrorKey>();
  const [passwordError, setPasswordError] = useState<AuthErrorKey>();
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
      // The server's message is already in the language on screen; '' = no answer.
      setFormError((error instanceof Error && error.message) || copy.loginFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <Section className="auth-page">
        <Container>
          <AuthCard title={copy.loginTitle}>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
                placeholder={copy.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={authErrorText(copy, passwordError)}
                autoComplete="current-password"
                enterKeyHint="go"
              />
              <Link to={ROUTES.FORGOT_PASSWORD} className="auth-link login-forgot-password">
                {copy.forgotLink}
              </Link>
              {formError && <p className="auth-form-error">{formError}</p>}
              <Button type="submit" variant="primary" loading={isSubmitting}>
                {copy.loginButton}
              </Button>
            </form>
            <p className="auth-switch">
              {copy.noAccount} <Link to={ROUTES.REGISTER}>{copy.registerLink}</Link>
            </p>
          </AuthCard>
        </Container>
      </Section>
    </PageLayout>
  );
}
