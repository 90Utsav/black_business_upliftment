import { AuthError, type AuthService, type User } from './types';

/**
 * Browser-only mock backend. Accounts live in localStorage so you can
 * sign up, refresh, and sign back in. NOT for production: passwords are
 * only lightly obfuscated, never hashed properly.
 */

const USERS_KEY = 'civictext.mock.users';
const SESSION_KEY = 'civictext.mock.session';
const LATENCY_MS = 600;

interface StoredUser extends User {
  secret: string;
}

const DEMO_ACCOUNT = {
  name: 'Amara Johnson',
  email: 'demo@civictext.org',
  password: 'password123',
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const obfuscate = (value: string) => btoa(unescape(encodeURIComponent(value)));

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch {
    /* storage unavailable */
  }
  return [];
}

function writeUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* storage unavailable */
  }
}

function ensureDemoAccount() {
  const users = readUsers();
  if (users.some((u) => u.email === DEMO_ACCOUNT.email)) return;
  users.push({
    id: 'demo',
    name: DEMO_ACCOUNT.name,
    email: DEMO_ACCOUNT.email,
    createdAt: new Date(0).toISOString(),
    secret: obfuscate(DEMO_ACCOUNT.password),
  });
  writeUsers(users);
}

function toPublic(stored: StoredUser): User {
  const { id, name, email, createdAt } = stored;
  return { id, name, email, createdAt };
}

function saveSession(user: User, remember: boolean) {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    const store = remember ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable */
  }
}

export const mockAuthService: AuthService = {
  async getSession() {
    ensureDemoAccount();
    try {
      const raw =
        sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  async signIn({ email, password, remember = false }) {
    await wait(LATENCY_MS);
    ensureDemoAccount();
    const user = readUsers().find(
      (u) => u.email === email.trim().toLowerCase(),
    );
    if (!user || user.secret !== obfuscate(password)) {
      throw new AuthError(
        'invalid-credentials',
        'That email and password combination did not match.',
      );
    }
    const publicUser = toPublic(user);
    saveSession(publicUser, remember);
    return publicUser;
  },

  async signUp({ name, email, password }) {
    await wait(LATENCY_MS);
    ensureDemoAccount();
    const users = readUsers();
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalized)) {
      throw new AuthError(
        'email-in-use',
        'An account with this email already exists. Try signing in instead.',
      );
    }
    const user: StoredUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalized,
      createdAt: new Date().toISOString(),
      secret: obfuscate(password),
    };
    users.push(user);
    writeUsers(users);
    const publicUser = toPublic(user);
    saveSession(publicUser, true);
    return publicUser;
  },

  async signOut() {
    await wait(200);
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage unavailable */
    }
  },

  async requestPasswordReset() {
    await wait(LATENCY_MS);
    ensureDemoAccount();
    // Always succeed so the form cannot be used to probe which emails exist.
  },
};

export const demoCredentials = {
  email: DEMO_ACCOUNT.email,
  password: DEMO_ACCOUNT.password,
};
