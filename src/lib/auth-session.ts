export type CrmSession = {
  sub: string;
  role: string;
  department: string | null;
  exp: number;
};

function secret() {
  const value = process.env.CRM_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!value) throw new Error('CRM_SESSION_SECRET or ADMIN_PASSWORD must be configured');
  return value;
}

function encode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function signature(input: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input));
  let binary = '';
  new Uint8Array(bytes).forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function createSessionToken(session: Omit<CrmSession, 'exp'> & { exp?: number }) {
  const payload: CrmSession = {
    ...session,
    exp: session.exp ?? Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  };
  const body = encode(JSON.stringify(payload));
  return `${body}.${await signature(body)}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    const expected = await signature(body);
    if (sig.length !== expected.length) return null;
    let diff = 0;
    for (let i = 0; i < sig.length; i += 1) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff !== 0) return null;
    const session = JSON.parse(decode(body)) as CrmSession;
    if (!session.sub || !session.role || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}
