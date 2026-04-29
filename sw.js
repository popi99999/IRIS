const CACHE_NAME = 'iris-v150';
const APP_SHELL_URL = new URL('./index.html', self.location.href).toString();
const MANIFEST_URL = new URL('./manifest.json', self.location.href).toString();
const PLUS_CSS_URL = new URL('./iris-plus.css', self.location.href).toString();
const PLUS_JS_URL = new URL('./iris-plus.js', self.location.href).toString();
const I18N_URL = new URL('./iris-i18n-config.js', self.location.href).toString();
const SUPABASE_CONFIG_URL = new URL('./supabase-config.js', self.location.href).toString();
const MEASUREMENT_GUIDE_URLS = [
  './assets/measurements/bag-depth.png',
  './assets/measurements/bag-height.png',
  './assets/measurements/bag-width.png',
  './assets/measurements/belt-width.png',
  './assets/measurements/bottom-knee-width.png',
  './assets/measurements/bottom-leg-opening.png',
  './assets/measurements/bottom-total-length.png',
  './assets/measurements/bottom-waist.png',
  './assets/measurements/upper-chest.png',
  './assets/measurements/upper-length.png',
  './assets/measurements/upper-shoulders.png',
  './assets/measurements/upper-sleeve.png',
].map(path => new URL(path, self.location.href).toString());
const ASSETS = [
  APP_SHELL_URL,
  MANIFEST_URL,
  PLUS_CSS_URL,
  PLUS_JS_URL,
  I18N_URL,
  SUPABASE_CONFIG_URL,
  ...MEASUREMENT_GUIDE_URLS,
];
const CORE_ASSET_URLS = new Set(ASSETS);
const CORE_ASSET_PATHS = new Set(ASSETS.map(url => new URL(url).pathname));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') {
    return;
  }

  const isSameOrigin = e.request.url.startsWith(self.location.origin);
  const requestUrl = new URL(e.request.url);
  const isCoreAsset = CORE_ASSET_URLS.has(e.request.url) || (isSameOrigin && CORE_ASSET_PATHS.has(requestUrl.pathname));
  const isNavigation = e.request.mode === 'navigate';

  if (isNavigation || isCoreAsset) {
    e.respondWith(
      fetch(new Request(e.request, { cache: 'reload' }))
        .then(res => {
          if (res.ok && isSameOrigin) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match(APP_SHELL_URL)))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok && isSameOrigin) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(err => {
      if (isNavigation) {
        return caches.match(APP_SHELL_URL);
      }

      throw err;
    }))
  );
});
