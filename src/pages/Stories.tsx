import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stories, type Story } from '../data/stories';
import styles from './Stories.module.css';

const toneClass: Record<Story['tone'], string> = {
  sage: styles.toneSage,
  peach: styles.tonePeach,
  rose: styles.toneRose,
  plum: styles.tonePlum,
};

function Avatar({ story, large = false }: { story: Story; large?: boolean }) {
  return (
    <span
      className={`${styles.avatar} ${toneClass[story.tone]} ${large ? styles.avatarLarge : ''}`}
      aria-hidden="true"
    >
      {story.initials}
    </span>
  );
}

export default function Stories() {
  useEffect(() => {
    document.title = 'Stories - CivicText';
  }, []);

  const featured = stories.find((s) => s.featured) ?? stories[0];
  const rest = stories.filter((s) => s.id !== featured.id);

  return (
    <section className={styles.section} id="stories">
      <div className="container">
        <header className={styles.header}>
          <p className={styles.kicker}>Stories</p>
          <h1 className={styles.title}>Funded by a text. Told by the people who sent it.</h1>
          <p className={styles.lead}>
            Organizers, owners and artists across the South on what changed
            when the right grant found them.
          </p>
          <p className={styles.sample}>
            Sample stories for demonstration. People and organizations shown
            here are fictional composites.
          </p>
        </header>

        <article className={styles.featured}>
          <div className={styles.featuredBody}>
            <p className={styles.featuredLabel}>Featured story</p>
            <blockquote className={styles.featuredQuote}>
              &ldquo;{featured.quote}&rdquo;
            </blockquote>
            {featured.body.map((para) => (
              <p key={para} className={styles.featuredPara}>
                {para}
              </p>
            ))}
            <div className={styles.person}>
              <Avatar story={featured} large />
              <div>
                <p className={styles.name}>{featured.name}</p>
                <p className={styles.meta}>
                  {featured.role}, {featured.org} &middot; {featured.city}, {featured.state}
                </p>
              </div>
            </div>
          </div>
          <aside className={styles.featuredAside}>
            <p className={styles.asideLabel}>Grant received</p>
            <p className={styles.asideGrant}>{featured.grant}</p>
            <p className={styles.asideAmount}>{featured.amount}</p>
            <p className={styles.asideCategory}>{featured.category}</p>
            <Link to="/grants" className={styles.asideLink}>
              Find grants like this <span aria-hidden="true">&rarr;</span>
            </Link>
          </aside>
        </article>

        <ul className={styles.grid}>
          {rest.map((s) => (
            <li key={s.id} className={styles.card}>
              <blockquote className={styles.quote}>&ldquo;{s.quote}&rdquo;</blockquote>
              <p className={styles.cardBody}>{s.body[0]}</p>
              <div className={styles.person}>
                <Avatar story={s} />
                <div>
                  <p className={styles.name}>{s.name}</p>
                  <p className={styles.meta}>
                    {s.org} &middot; {s.city}, {s.state}
                  </p>
                </div>
              </div>
              <p className={styles.cardGrant}>
                <span>{s.grant}</span>
                <strong>{s.amount}</strong>
              </p>
            </li>
          ))}
        </ul>

        <div className={styles.cta}>
          <h2>Got funded through CivicText?</h2>
          <p>
            We would love to tell your story. Email us a few sentences and we
            will follow up.
          </p>
          <a href="mailto:stories@civictext.org" className={styles.ctaBtn}>
            Share your story
          </a>
        </div>
      </div>
    </section>
  );
}
