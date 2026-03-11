const SUSPICIOUS_KEYWORDS = [
  "paypal",
  "login",
  "bank",
  "account",
  "verify",
  "secure",
  "update",
  "sign-in",
  "support",
  "wallet",
  "billing",
  "confirm",
  "credential",
  "password",
  "security",
];

/**
 * Checks a hostname for suspicious keywords often used in phishing.
 * @param hostname The hostname to check (e.g., "paypal-secure.com")
 * @returns An array of matched keywords
 */
export function checkSuspiciousKeywords(hostname: string): string[] {
  const lowerHostname = hostname.toLowerCase();
  return SUSPICIOUS_KEYWORDS.filter((keyword) =>
    lowerHostname.includes(keyword)
  );
}
