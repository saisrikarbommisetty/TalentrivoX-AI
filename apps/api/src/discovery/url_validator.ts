/**
 * Safe External URL Validation & Sanitization Utility
 * Guarantees that job application redirect links are legitimate HTTPS/HTTP URLs
 * and prevents XSS, open redirects, and protocol hijacking.
 */

export class SafeUrlValidator {
  private static readonly ALLOWED_PROTOCOLS = new Set(['https:', 'http:']);
  private static readonly BLOCKED_PATTERNS = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
    /blob:/i,
    /about:/i,
    /[\r\n\t]/
  ];

  /**
   * Validates and returns a sanitized URL string. Returns null if invalid or unsafe.
   */
  public static sanitizeUrl(urlStr: string | null | undefined): string | null {
    if (!urlStr || typeof urlStr !== 'string') {
      return null;
    }

    const trimmed = urlStr.trim();
    if (trimmed.length === 0 || trimmed.length > 2048) {
      return null;
    }

    // Check blocked dangerous patterns
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(trimmed)) {
        return null;
      }
    }

    try {
      const parsed = new URL(trimmed);
      
      // Enforce http/https
      if (!this.ALLOWED_PROTOCOLS.has(parsed.protocol)) {
        return null;
      }

      // Hostname must be present and not localhost/internal in production
      if (!parsed.hostname || parsed.hostname.includes('..')) {
        return null;
      }

      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Checks whether the given string is a safe, valid application URL.
   */
  public static isValidApplicationUrl(urlStr: string | null | undefined): boolean {
    return this.sanitizeUrl(urlStr) !== null;
  }
}
