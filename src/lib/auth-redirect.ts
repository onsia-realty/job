export const AUTH_STAY_REDIRECT_KEY = 'auth_stay_redirect';

/** Only allow a relative STAY route to survive an authentication round trip. */
export function safeStayRedirect(value: string | null | undefined): string | null {
  if (!value || !/^\/stay(?:\/|\?|#|$)/.test(value)) return null;

  const base = 'https://local.invalid';
  const target = new URL(value, base);
  if (target.origin !== base || !/^\/stay(?:\/|$)/.test(target.pathname)) {
    return null;
  }

  return `${target.pathname}${target.search}${target.hash}`;
}
