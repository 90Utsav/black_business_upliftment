import PhoneMockup, { type ChatMessage } from './PhoneMockup';
import styles from './Hero.module.css';

const demoMessages: ChatMessage[] = [
  {
    id: 1,
    from: 'user',
    text: 'I run a youth mentorship program in Atlanta & need supplies.',
  },
  {
    id: 2,
    from: 'bot',
    text:
      'Hey! We found a match: The "Atlanta Rise Grant" offers up to $2,500. Deadline: Nov 30.\n\n' +
      'Use this draft to apply: "We are seeking support to provide supply bags for our Atlanta youth..."',
  },
];

const tags = [
  { icon: '\u{1F331}', label: 'Grassroots-First', tone: styles.tagSage },
  { icon: '\u{1F4BC}', label: 'Equitable Capital', tone: styles.tagPeach },
  { icon: '\u{1F4AC}', label: 'Easy SMS', tone: styles.tagRose },
];

export default function Hero() {
  return (
    <section className={styles.hero} id="demo">
      <div className={`container ${styles.grid}`}>
        <div className={styles.copy}>
          <h1 className={styles.title}>
            <span className={styles.titleLine}>Funding Our Futures.</span>{' '}
            <span className={styles.titleLine}>One Text at a Time.</span>
          </h1>
          <p className={styles.lead}>
            The SMS Grant Finder built for grassroots organizers. Text your
            community needs and instantly get matched with local capital&mdash;no
            complex databases, no red tape.
          </p>

          <div className={styles.actions}>
            <a href="#how-it-works" className={styles.primary}>
              Try the Demo
            </a>
            <a href="/grants" className={styles.secondary}>
              View Active Grants <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <ul className={styles.tags} aria-label="Highlights">
            {tags.map((t) => (
              <li key={t.label} className={`${styles.tag} ${t.tone}`}>
                <span aria-hidden="true">{t.icon}</span> {t.label}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.visual}>
          <div className={styles.photoWrap}>
            <img
              className={styles.photo}
              src="https://images.unsplash.com/photo-1611432579699-484f7990b127?auto=format&fit=crop&w=900&q=80"
              alt="A smiling Black woman community organizer in a white top, photographed against a bright background"
              loading="eager"
            />
          </div>
          <div className={styles.phone}>
            <PhoneMockup messages={demoMessages} />
          </div>
        </div>
      </div>
    </section>
  );
}
