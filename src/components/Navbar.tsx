import { useState } from 'react';
import styles from './Navbar.module.css';

const links = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Grants Database', href: '#grants' },
  { label: 'Stories', href: '#stories' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <a href="#" className={styles.brand} aria-label="CivicText home">
          <span className={styles.brandName}>CivicText</span>
          <span className={styles.brandMark} aria-hidden="true">
            <svg viewBox="0 0 24 18" width="22" height="16">
              <rect x="0" y="0" width="24" height="18" rx="2" fill="#2b1d3a" />
              <rect x="0" y="6" width="24" height="6" fill="#4f6b3f" />
              <rect x="0" y="12" width="24" height="6" fill="#c9623b" />
              <path d="M0 0l12 9L0 18z" fill="#f6efe6" />
            </svg>
          </span>
        </a>

        <button
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="primary-nav"
          className={`${styles.nav} ${open ? styles.navOpen : ''}`}
          aria-label="Primary"
        >
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#demo" className={styles.cta} onClick={() => setOpen(false)}>
            Sign Up
          </a>
        </nav>
      </div>
    </header>
  );
}
