/* AoiMusic service worker: 把页面（主要是 MusicKit 自己）发往 *.music.apple.com 的请求
   改道到中转服务，绕开苹果对网页来源的拦截。中转地址通过注册时的 ?relay= 参数传入。 */
const RELAY = new URLSearchParams(self.location.search).get('relay') || '';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (!RELAY) return;
  let u;
  try { u = new URL(e.request.url); } catch { return; }
  if (!/(^|\.)music\.apple\.com$/.test(u.hostname)) return;
  if (u.hostname === 'js-cdn.music.apple.com') return; // MusicKit script: public static file, load directly
  if (e.request.url.startsWith(RELAY)) return;

  const target = RELAY + '?target=' + encodeURIComponent(e.request.url);
  const run = (async () => {
    const init = { method: e.request.method, headers: e.request.headers, redirect: 'follow' };
    if (!['GET', 'HEAD'].includes(e.request.method)) {
      try { init.body = await e.request.clone().arrayBuffer(); } catch {}
    }
    return fetch(target, init);
  })();
  e.respondWith(run);
});
