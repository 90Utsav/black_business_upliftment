import type { ReactNode } from 'react';
import Reveal from './Reveal';
import styles from './HowItWorks.module.css';

interface Step {
  title: string;
  body: string;
  icon: ReactNode;
}

const iconProps = {
  width: 30,
  height: 30,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const steps: Step[] = [
  {
    title: '1. Send a Text',
    body: 'describe your project or needs in your everyday voice.',
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-4.6A8.4 8.4 0 1 1 21 11.5z" />
        <path d="M8 10h8M8 13h5" />
      </svg>
    ),
  },
  {
    title: '2. Instantly Matched',
    body: 'our database finds grants built for community leaders.',
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="10" r="3" />
        <path d="M6.5 18.5a6.5 6.5 0 0 1 11 0" />
      </svg>
    ),
  },
  {
    title: '3. Get Your Draft',
    body: 'get the exact match and an application starter sent straight to your phone.',
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M11 18h2" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className="container">
        <Reveal>
          <h2 className={styles.heading}>How It Works</h2>
        </Reveal>
        <ol className={styles.steps}>
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} className={styles.step} delay={i * 120}>
              <span className={styles.icon}>{s.icon}</span>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepBody}>{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
