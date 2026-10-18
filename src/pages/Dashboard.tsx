import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard - CivicText';
  }, []);

  const handleSignOut = async () => {
    setLeaving(true);
    await signOut();
    navigate('/', { replace: true });
  };

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.kicker}>Dashboard</p>
        <h1 className={styles.title}>Welcome, {firstName}.</h1>
        <p className={styles.lead}>
          You are signed in as <strong>{user?.email}</strong>. Grant matches and
          saved drafts will appear here once the matching service is connected.
        </p>
        <div className={styles.cards}>
          <article className={styles.card}>
            <h2>Active matches</h2>
            <p className={styles.big}>0</p>
            <p className={styles.muted}>Text your needs to get your first match.</p>
          </article>
          <article className={styles.card}>
            <h2>Saved drafts</h2>
            <p className={styles.big}>0</p>
            <p className={styles.muted}>Application starters you have kept.</p>
          </article>
          <article className={styles.card}>
            <h2>Upcoming deadlines</h2>
            <p className={styles.big}>0</p>
            <p className={styles.muted}>Nothing due in the next 30 days.</p>
          </article>
        </div>
        <button
          type="button"
          className={styles.signOut}
          onClick={handleSignOut}
          disabled={leaving}
        >
          {leaving ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </section>
  );
}
