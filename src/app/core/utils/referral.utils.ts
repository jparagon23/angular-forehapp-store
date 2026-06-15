export function getActiveReferralCode(): string | null {
  const code   = localStorage.getItem('referralCode');
  const expiry = localStorage.getItem('referralCodeExpiry');
  if (!code || !expiry) return null;
  if (Date.now() > parseInt(expiry, 10)) {
    localStorage.removeItem('referralCode');
    localStorage.removeItem('referralCodeExpiry');
    return null;
  }
  return code;
}

export function saveReferralCode(code: string): void {
  const expiry = Date.now() + 3 * 24 * 60 * 60 * 1000;
  localStorage.setItem('referralCode', code.toUpperCase());
  localStorage.setItem('referralCodeExpiry', expiry.toString());
}
