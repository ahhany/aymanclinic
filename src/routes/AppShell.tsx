import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { Button } from '../components/ui/button';

export function AppShell() {
  const { state, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b-4 border-clinic-red bg-white text-clinic-navy shadow">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-wide">
            <img src="/logo.png" alt="Ayman Clinic" className="h-10 w-auto" />
            {t('appShort')}
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/" className="rounded px-3 py-1.5 hover:bg-clinic-line">
              {t('navRegistry')}
            </Link>
            <Link to="/settings" className="rounded px-3 py-1.5 hover:bg-clinic-line">
              {t('navSettings')}
            </Link>
            <Link to="/medications" className="rounded px-3 py-1.5 hover:bg-clinic-line">
              {t('navMedications')}
            </Link>
            <Link to="/dashboards" className="rounded px-3 py-1.5 hover:bg-clinic-line">
              {t('navDashboards')}
            </Link>
          </nav>
          <div className="ms-auto flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-clinic-navy/70">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              {t('connectionOnline')}
            </span>
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="rounded border border-clinic-navy/40 px-2 py-1 text-xs text-clinic-navy hover:bg-clinic-line"
            >
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
            <span className="hidden text-clinic-navy/80 sm:inline">{state?.user.name}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-clinic-navy/40 bg-transparent text-clinic-navy hover:bg-clinic-line"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
