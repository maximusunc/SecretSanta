/**
 * Push subscriptions come from the browser, so a tampered one could point the
 * server at any URL (e.g. something on the home network). Only accept the real
 * push services browsers use.
 */
const PUSH_HOSTS = [
  /^web\.push\.apple\.com$/, // Safari / iOS home-screen apps
  /^fcm\.googleapis\.com$/, // Chrome, Edge (Chromium), Android
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /\.notify\.windows\.com$/, // legacy Edge / Windows
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && !u.port && PUSH_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}
