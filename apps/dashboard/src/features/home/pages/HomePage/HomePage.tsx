import { useAuth } from '../../../../services/auth/AuthContext';
import './HomePage.css';

// Placeholder — trainees list, trainee detail and the plan builder arrive in Phase 6.
export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="home-page">
      <header className="home-header">
        <h1 className="home-title">Coach dashboard</h1>
        <button className="home-logout" type="button" onClick={logout}>
          Log out
        </button>
      </header>
      <p className="home-text">Signed in as {user?.name}. Trainees and plans will appear here.</p>
    </main>
  );
}
