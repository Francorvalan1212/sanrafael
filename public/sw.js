const CACHE = 'que-hacemos-shell-v2';
const SHELL = ['/', '/index.html', '/favicon.svg', '/san-rafael-mark.svg', '/manifest.webmanifest'];
self.addEventListener('install', event => {
	event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
	event.waitUntil(caches.keys()
		.then(keys => Promise.all(keys.filter(key => key.startsWith('que-hacemos-shell-') && key !== CACHE).map(key => caches.delete(key))))
		.then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
	const request = event.request;
	const url = new URL(request.url);
	if (request.method !== 'GET' || url.origin !== self.location.origin) return;

	const cacheable = SHELL.includes(url.pathname) || url.pathname.startsWith('/assets/');
	const networkResponse = fetch(request);
	event.respondWith(networkResponse.catch(() => {
		if (request.mode === 'navigate') return caches.match('/index.html');
		return caches.match(request);
	}));
	if (cacheable) {
		event.waitUntil(networkResponse.then(response => {
			if (!response.ok || response.type !== 'basic') return;
			return caches.open(CACHE).then(cache => cache.put(request, response.clone()));
		}).catch(() => {}));
	}
});
