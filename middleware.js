import { next } from '@vercel/functions';

const PASSWORD_HASH = '5729409e8dc3b9146ca1ce8a33748ae998c06ed8a5a460bfad57b0e452701a9b';
const COOKIE_NAME = 'farm127_resource_access';
const SESSION_VALUE = 'allowed';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const config = {
  matcher: '/(.*)',
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const cookie = request.headers.get('cookie') || '';
  const hasAccess = cookie
    .split(';')
    .map((part) => part.trim())
    .includes(`${COOKIE_NAME}=${SESSION_VALUE}`);

  if (hasAccess) return next();

  if (request.method === 'POST' && url.pathname === '/__farm127_auth') {
    const form = await request.formData();
    const password = String(form.get('password') || '');
    const hash = await sha256(password);

    if (hash === PASSWORD_HASH) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Set-Cookie': `${COOKIE_NAME}=${SESSION_VALUE}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return loginPage(true);
  }

  return loginPage(false);
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function loginPage(showError) {
  const error = showError
    ? '<p class="error" role="alert">That password is not correct. Please try again.</p>'
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>FARM127 Resource Navigator</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #F7F1E6;
      color: #2F2924;
      font-family: Arial, Helvetica, sans-serif;
    }
    main {
      width: min(100%, 430px);
      padding: 36px;
      border: 1px solid rgba(74, 52, 40, .18);
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 18px 45px rgba(47, 41, 36, .10);
    }
    .eyebrow {
      margin: 0 0 8px;
      color: #6F7B4B;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .09em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 12px;
      color: #4A3428;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 30px;
      line-height: 1.05;
    }
    p { margin: 0 0 22px; line-height: 1.5; }
    label {
      display: block;
      margin-bottom: 7px;
      font-size: 14px;
      font-weight: 700;
    }
    input {
      width: 100%;
      min-height: 48px;
      margin-bottom: 14px;
      padding: 10px 12px;
      border: 1px solid #8A8178;
      border-radius: 9px;
      font: inherit;
    }
    button {
      width: 100%;
      min-height: 48px;
      border: 0;
      border-radius: 999px;
      background: #4A3428;
      color: #fff;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }
    button:hover { opacity: .92; }
    .error {
      margin: -8px 0 16px;
      color: #8a2f24;
      font-size: 14px;
      font-weight: 700;
    }
    .note {
      margin: 18px 0 0;
      color: #6a625b;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">FARM127</p>
    <h1>Resource Navigator</h1>
    <p>This resource is for FARM127 mentors, staff, and approved partners.</p>
    ${error}
    <form method="post" action="/__farm127_auth">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Continue</button>
    </form>
    <p class="note">Access stays active on this device for 7 days.</p>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
