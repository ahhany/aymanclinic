import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-clinic-paper p-4">
      <div className="flex w-full max-w-md flex-col items-center">
        <img src="/logo.png" alt="Ayman Clinic" className="mb-4 h-20 w-auto" />
        <Card className="w-full overflow-hidden">
          <div className="border-b-4 border-clinic-red bg-clinic-navy px-6 py-5 text-white">
            <h1 className="text-xl font-bold">{t('appTitle')}</h1>
            <p className="mt-1 text-sm text-white/70">{t('loginSubtitle')}</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4 p-6">
            <label className="block text-sm font-medium">
              {t('email')}
              <Input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                dir="ltr"
              />
            </label>
            <label className="block text-sm font-medium">
              {t('password')}
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                dir="ltr"
              />
            </label>
            {error && <p className="text-sm font-medium text-clinic-red">{t('loginError')}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {t('login')}
            </Button>
            <p className="text-center text-xs text-slate-400" dir="ltr">
              {t('demoHint')}
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
