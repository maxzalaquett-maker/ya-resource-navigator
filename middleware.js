import { next } from '@vercel/functions';

const PASSWORD_HASH = '5729409e8dc3b9146ca1ce8a33748ae998c06ed8a5a460bfad57b0e452701a9b';
const COOKIE_NAME = 'farm127_resource_access';
const SESSION_VALUE = 'allowed';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const PUBLIC_LOGIN_ASSETS = new Set([
  '/styles.css',
  '/brand-fonts.css',
  '/login.css',
  '/assets/farm127-logo.png',
  '/assets/icon-192.png'
]);

export const config = {
  matcher: '/(.*)',
};

export default async function middleware(request) {
  const url = new URL(request.url);

  if (PUBLIC_LOGIN_ASSETS.has(url.pathname)) return next();

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
    ? '<p class="auth-error" role="alert">That password is not correct. Please try again.</p>'
    : '';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#4A3428">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <link rel="icon" href="/assets/icon-192.png" type="image/png">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/brand-fonts.css">
  <link rel="stylesheet" href="/login.css">
  <title>Charlotte Young Adult Resource Navigator — Private Access</title>
</head>
<body class="auth-page">
  <a class="skip-link" href="#main-content">Skip to main content</a>

  <header class="site-header">
    <div class="header-inner shell">
      <div class="brand" aria-label="Charlotte Young Adult Resource Navigator">
        <img src="/assets/farm127-logo.png" alt="the program" width="88" height="71">
        <span>
          <strong>Resource Navigator</strong>
          <small>Charlotte young adult support directory</small>
        </span>
      </div>
    </div>
  </header>

  <nav class="view-nav auth-nav" aria-label="Access status">
    <div class="shell nav-scroll">
      <span class="auth-nav-label">Private access</span>
    </div>
  </nav>

  <main class="auth-main" id="main-content">
    <section class="auth-hero" aria-labelledby="auth-title">
      <div class="auth-grid">
        <div class="auth-copy">
          <p class="eyebrow">program mentor resource</p>
          <h1 id="auth-title">Find the right support, faster.</h1>
          <p class="auth-lede">The Resource Navigator brings practical young-adult resources into one place so program mentors, staff, and approved partners can quickly find a strong next step.</p>
          <div class="auth-feature-row" aria-label="Resource Navigator features">
            <span class="auth-feature">Local resource directory</span>
            <span class="auth-feature">Foster care guide</span>
            <span class="auth-feature">Support by need</span>
          </div>
        </div>

        <section class="auth-card" aria-labelledby="login-heading">
          <div class="auth-card-accent" aria-hidden="true"></div>
          <div class="auth-card-inner">
            <p class="eyebrow">Protected resource</p>
            <h2 id="login-heading">Welcome back</h2>
            <p class="auth-card-copy">Enter the shared the program password to continue to the Resource Navigator.</p>
            ${error}
            <form method="post" action="/__farm127_auth">
              <div class="auth-field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter password" required autofocus>
              </div>
              <button class="button button-primary auth-submit" type="submit">Continue to Resource Navigator</button>
            </form>
            <p class="auth-note">Access stays active on this device for 7 days.</p>
          </div>
        </section>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="footer-grid shell">
      <div>
        <strong>the program</strong>
        <p>Practical support rooted in relationship.</p>
      </div>
      <div class="auth-footer-meta">
        <p>Private resource for mentors, staff, and approved partners.</p>
      </div>
    </div>
  </footer>
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
