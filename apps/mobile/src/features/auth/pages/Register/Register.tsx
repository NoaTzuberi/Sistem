import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconAt, IconKey, IconUser } from '@tabler/icons-react';
import { AuthScreen } from '../../components/AuthScreen/AuthScreen';
import { AuthField } from '../../components/AuthField/AuthField';
import { AuthSubmitButton } from '../../components/AuthSubmitButton/AuthSubmitButton';
import { SocialButtons } from '../../components/SocialButtons/SocialButtons';
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
    <AuthScreen title={copy.registerTitle} switchLabel={copy.loginLink} switchTo={ROUTES.LOGIN}>
      <form className="auth-glass-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          type="text"
          label={copy.name}
          icon={<IconUser size={20} />}
          placeholder={copy.namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={authErrorText(copy, nameError)}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
        />
        <AuthField
          type="email"
          label={copy.email}
          icon={<IconAt size={20} />}
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder={copy.email}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={authErrorText(copy, emailError)}
          autoComplete="email"
        />
        <AuthField
          type="password"
          label={copy.password}
          icon={<IconKey size={20} />}
          placeholder={copy.password}
          helperText={copy.newPasswordPlaceholder}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={authErrorText(copy, passwordError)}
          autoComplete="new-password"
          enterKeyHint="go"
        />
        {formError && <p className="auth-glass-error">{formError}</p>}
        <AuthSubmitButton loading={isSubmitting}>{copy.registerButton}</AuthSubmitButton>
        <SocialButtons />
      </form>
    </AuthScreen>
  );
}
