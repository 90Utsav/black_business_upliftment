import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Bubble, DraftCard, MatchList, TypingDots } from '../components/demo/ChatParts';
import IntentPanel from '../components/demo/IntentPanel';
import { SUGGESTIONS, buildDraftReply, buildReplies, nextId, type Msg } from '../lib/conversation';
import type { Intent } from '../lib/intent';
import { isSaved, saveMatch } from '../lib/savedMatches';
import styles from './Demo.module.css';

const REPLY_DELAY = 900;

export default function Demo() {
  const { user, status } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);
  const [lastUserText, setLastUserText] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const [params] = useSearchParams();
  const autoSent = useRef(false);

  useEffect(() => {
    document.title = 'Try the Demo - CivicText';
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  const push = (...next: Msg[]) => setMessages((prev) => [...prev, ...next]);

  const reply = (build: () => Msg[]) => {
    setTyping(true);
    timer.current = window.setTimeout(() => {
      push(...build());
      setTyping(false);
    }, REPLY_DELAY);
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    setInput('');
    setLastUserText(clean);
    push({ id: nextId(), from: 'user', kind: 'text', text: clean });
    reply(() => {
      const { intent, messages: replies } = buildReplies(clean);
      setLastIntent(intent);
      return replies;
    });
  };

  const requestDraft = (grantId: string) => {
    const match = [...messages]
      .reverse()
      .flatMap((m) => (m.kind === 'matches' ? m.results : []))
      .find((r) => r.grant.id === grantId);
    if (!match || !lastIntent || typing) return;
    push({ id: nextId(), from: 'user', kind: 'text', text: `Draft for the ${match.grant.name}, please.` });
    reply(() => buildDraftReply(match.grant, lastUserText, lastIntent, user?.name));
  };

  const save = (grantId: string, draft: string, userText: string) => {
    if (!user) return;
    saveMatch(user.id, { grantId, draft, message: userText });
    setSavedIds((ids) => [...ids, grantId]);
  };

  // Allow deep links like /demo?q=... to start the conversation immediately.
  useEffect(() => {
    const q = params.get('q');
    if (q && !autoSent.current) {
      autoSent.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setMessages([]);
    setTyping(false);
    setLastIntent(null);
    setLastUserText('');
    setInput('');
  };

  return (
    <section className={styles.section} id="demo">
      <div className={`container ${styles.layout}`}>
        <div className={styles.chatWrap}>
          <header className={styles.chatHeader}>
            <div>
              <p className={styles.kicker}>Try the demo</p>
              <h1 className={styles.title}>Text us what you need.</h1>
            </div>
            {messages.length > 0 && (
              <button type="button" className={styles.reset} onClick={reset}>
                Start over
              </button>
            )}
          </header>
          <p className={styles.note}>
            Simulated conversation. Nothing is sent by SMS and nothing leaves your browser.
          </p>

          <div className={styles.thread} aria-live="polite">
            {messages.length === 0 && (
              <div className={styles.empty}>
                <Bubble from="bot">
                  Hi, this is CivicText. Tell me about your project or your business in your own
                  words. Who do you serve, what do you need money for, and where are you?
                </Bubble>
                <div className={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className={styles.chip} onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              if (m.kind === 'text') return <Bubble key={m.id} from={m.from}>{m.text}</Bubble>;
              if (m.kind === 'matches') {
                return (
                  <MatchList
                    key={m.id}
                    results={m.results}
                    selected={m.intent.filters.audiences}
                    onDraft={(r) => requestDraft(r.grant.id)}
                  />
                );
              }
              const already = savedIds.includes(m.grant.id) || (user ? isSaved(user.id, m.grant.id) : false);
              return (
                <DraftCard
                  key={m.id}
                  grantName={m.grant.name}
                  draft={m.draft}
                  canSave={status === 'authenticated'}
                  saved={already}
                  onSave={() => save(m.grant.id, m.draft, m.userText)}
                />
              );
            })}
            {typing && <TypingDots />}
            <div ref={endRef} />
          </div>

          <form className={styles.composer} onSubmit={onSubmit}>
            <label htmlFor="demo-input" className="sr-only">
              Your message
            </label>
            <textarea
              id="demo-input"
              rows={1}
              placeholder="Message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button type="submit" className={styles.send} disabled={!input.trim() || typing} aria-label="Send">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M3 11.5l17-8-5 17-3.5-6.5z" />
              </svg>
            </button>
          </form>
          {status !== 'authenticated' && (
            <p className={styles.signinHint}>
              <Link to="/signin">Sign in</Link> to save drafts to your dashboard.
            </p>
          )}
        </div>

        <IntentPanel intent={lastIntent} />
      </div>
    </section>
  );
}
