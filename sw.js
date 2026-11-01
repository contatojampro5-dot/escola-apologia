// Service worker da Escola Apologia: deixa o app abrir mesmo sem internet.
// Ao mudar os arquivos básicos, aumente a versão para limpar o cache antigo.
const VERSAO = 'apologia-v1';
const BASICOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './apple-touch-icon.png',
  './icon-512.png',
  './favicon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Página do app: tenta a internet primeiro (pega atualizações), senão usa o cache.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const copia = r.clone(); caches.open(VERSAO).then(c => c.put('./index.html', copia)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Arquivos do próprio site e fontes do Google: usa o cache e atualiza por trás.
  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin === self.location.origin || fonte) {
    e.respondWith(
      caches.match(req).then(cache => {
        const rede = fetch(req).then(r => {
          if (r && (r.ok || r.type === 'opaque')) { const copia = r.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
          return r;
        }).catch(() => cache);
        return cache || rede;
      })
    );
  }
  // O resto (login, sincronização) segue direto para a internet.
});
