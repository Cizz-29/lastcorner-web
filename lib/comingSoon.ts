// Pagina di attesa mostrata al pubblico finché il nuovo sito non viene
// annunciato ufficialmente.
//
// Viene servita direttamente dal middleware come HTML completo, non come
// pagina Next: serve infatti a rispondere con lo stato 503, e un rewrite
// non permette di cambiare il codice di stato. Il 503 con Retry-After è il
// modo che Google raccomanda per l'indisponibilità temporanea: segnala che
// il sito tornerà, evitando che le pagine già indicizzate vengano rimosse
// dai risultati (cosa che accadrebbe con un 404 o con un noindex).

export const COMING_SOON_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lastcorner.net — Stiamo per tornare</title>
<meta name="description" content="Lastcorner.net sta per tornare con una veste tutta nuova.">
<link rel="icon" href="/images/logo.svg" type="image/svg+xml">
<style>
  @font-face {
    font-family: 'Akira Expanded';
    src: url('/fonts/AkiraExpanded-SuperBold.woff2') format('woff2');
    font-weight: 800; font-style: normal; font-display: swap;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh;
    background: #131318;
    color: #fff;
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex; align-items: center; justify-content: center;
    padding: 24px; text-align: center;
    background-image: radial-gradient(circle at 50% 0%, rgba(255,58,58,0.13), transparent 55%);
  }
  .box { max-width: 560px; }
  .logo { width: 132px; height: auto; margin: 0 auto 40px; display: block; }
  h1 {
    font-family: 'Akira Expanded', sans-serif;
    font-weight: 800;
    font-size: clamp(26px, 6vw, 44px);
    line-height: 1.12;
    letter-spacing: -0.01em;
    margin-bottom: 20px;
  }
  .accent { color: #FF3A3A; }
  p { font-size: 15px; line-height: 1.75; color: #C3C3C3; margin-bottom: 14px; }
  .rule { width: 52px; height: 3px; background: #FF3A3A; border-radius: 3px; margin: 32px auto; }
  .social { display: flex; gap: 14px; justify-content: center; margin-top: 34px; flex-wrap: wrap; }
  .social a {
    display: inline-flex; align-items: center; justify-content: center;
    width: 42px; height: 42px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.16);
    color: #fff; text-decoration: none; transition: border-color .2s, background-color .2s;
  }
  .social a:hover { border-color: #FF3A3A; background: rgba(255,58,58,0.12); }
  .social svg { width: 19px; height: 19px; fill: currentColor; }
  footer { margin-top: 44px; font-size: 11px; color: #6b6b73; letter-spacing: .04em; }
</style>
</head>
<body>
  <main class="box">
    <img src="/images/logo.svg" alt="Lastcorner.net" class="logo">
    <h1>Stiamo per <span class="accent">tornare</span></h1>
    <div class="rule"></div>
    <p>Lastcorner.net sta per presentarsi con una veste completamente nuova.</p>
    <p>Manca poco: seguici sui nostri canali per non perderti l'annuncio.</p>
    <div class="social">
      <a href="https://www.instagram.com/lastcorner_net/" aria-label="Instagram" rel="noopener">
        <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      </a>
      <a href="https://www.tiktok.com/@lastcornernet" aria-label="TikTok" rel="noopener">
        <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
      </a>
      <a href="https://www.youtube.com/@lastcornernet" aria-label="YouTube" rel="noopener">
        <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </a>
      <a href="https://www.facebook.com/profile.php?id=61575634843637" aria-label="Facebook" rel="noopener">
        <svg viewBox="0 0 24 24"><path d="M15.5 8.5V6.9c0-.8.2-1.2 1.4-1.2h1.6V2.6c-.3 0-1.3-.1-2.5-.1-2.6 0-4.4 1.6-4.4 4.4v1.6H9v3.3h2.6V20h3.9v-8.2h2.7l.4-3.3h-3.1z"/></svg>
      </a>
    </div>
    <footer>© ${new Date().getFullYear()} LASTCORNER.NET</footer>
  </main>
</body>
</html>`

/** Percorsi sempre raggiungibili anche a sito bloccato. */
export function isComingSoonExempt(pathname: string): boolean {
  return (
    pathname.startsWith('/studio') || // la redazione deve poter pubblicare
    pathname.startsWith('/telemetria') || // area interna, già protetta da password
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/telemetria-data/') ||
    pathname === '/ads.txt' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/favicon.ico' ||
    pathname === '/icon'
  )
}
