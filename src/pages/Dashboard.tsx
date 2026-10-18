import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { grants } from '../data/grants';
import { daysUntil, formatAmount } from '../lib/grantSearch';
import { getSaved, onSavedChange, removeMatch, type SavedMatch } from '../lib/savedMatches';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [saved, setSaved] = useState<SavedMatch[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Dashboard - CivicText';
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = () => setSaved(getSaved(user.id));
    load();
    return onSavedChange(load);
  }, [user]);

  const handleSignOut = async () => {
    setLeaving(true);
    await signOut();
    navigate('/', { replace: true });
  };

  const copy = async (s: SavedMatch) => {
    try {
      await navigator.clipboard.writeText(s.draft);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const firstName = user?.name.split(' ')[0] ?? 'there';
  const withGrant = saved
    .map((s) => ({ saved: s, grant: grants.find((g) => g.id === s.grantId) }))
    .filter((x): x is { saved: SavedMatch; grant: NonNullable<typeof x.grant> } => Boolean(x.grant));
  const dueSoon = withGrant.filter(({ grant }) => {
    const d = daysUntil(grant.deadline);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.kicker}>Dashboard</p>
        <h1 className={styles.title}>Welcome, {firstName}.</h1>
        <p className={styles.lead}>
          Signed in as <strong>{user?.email}</strong>. Drafts you save from the demo land here.
        </p>

        <div className={styles.cards}>
          <article className={styles.card}>
            <h2>Saved matches</h2>
            <p className={styles.big}>{withGrant.length}</p>
            <p className={styles.muted}>Grants you asked for a draft on.</p>
          </article>
          <article className={styles.card}>
            <h2>Drafts ready</h2>
            <p className={styles.big}>{withGrant.filter((x) => x.saved.draft).length}</p>
            <p className={styles.muted}>Application starters you can copy.</p>
          </article>
          <article className={styles.card}>
            <h2>Due in 30 days</h2>
            <p className={styles.big}>{dueSoon}</p>
            <p className={styles.muted}>{dueSoon ? 'Do not let these slip.' : 'Nothing urgent right now.'}</p>
          </article>
        </div>

        <h2 className={styles.sectionTitle}>Your saved drafts</h2>
        {withGrant.length === 0 ? (
          <div className={styles.empty}>
            <p>No saved drafts yet.</p>
            <Link to="/demo" className={styles.emptyBtn}>
              Try the demo
            </Link>
          </div>
        ) : (
          <ul className={styles.list}>
            {withGrant.map(({ saved: s, grant }) => {
              const d = daysUntil(grant.deadline);
              return (
                <li key={s.id} className={styles.item}>
                  <div className={styles.itemHead}>
                    <div>
                      <p className={styles.itemName}>{grant.name}</p>
                      <p className={styles.itemMeta}>
                        {grant.funder} &middot; {formatAmount(grant.amountMin, grant.amountMax)} &middot;{' '}
                        {d === null ? 'Rolling' : d < 0 ? 'Closed' : `${d} days left`}
                      </p>
                    </div>
                    <div className={styles.itemActions}>
                      <button type="button" className={styles.smallBtn} onClick={() => copy(s)}>
                        {copiedId === s.id ? 'Copied' : 'Copy draft'}
                      </button>
                      <a className={styles.smallLink} href={grant.url} target="_blank" rel="noopener noreferrer">
                        Apply
                      </a>
                      <button
                        type="button"
                        className={styles.remove}
                        onClick={() => user && removeMatch(user.id, s.id)}
                        aria-label={`Remove ${grant.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className={styles.itemMessage}>You wrote: &ldquo;{s.message}&rdquo;</p>
                  <details className={styles.details}>
                    <summary>Show draft</summary>
                    <pre className={styles.draft}>{s.draft}</pre>
                  </details>
                </li>
              );
            })}
          </ul>
        )}

        <button type="button" className={styles.signOut} onClick={handleSignOut} disabled={leaving}>
          {leaving ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </section>
  );
}
