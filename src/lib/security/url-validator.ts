/**
 * URL Validation Utility — SSRF Protection
 * 
 * Validates user-supplied URLs to prevent Server-Side Request Forgery attacks.
 * Blocks requests to internal networks, cloud metadata endpoints, and loopback addresses.
 */

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,                    // AWS IMDS / Link-local
  /^0\./,                           // 0.0.0.0 range
  /^\[::1\]$/,                      // IPv6 loopback
  /^\[fc/i,                         // IPv6 ULA
  /^\[fd/i,                         // IPv6 ULA
  /^\[fe80:/i,                      // IPv6 link-local
  /\.internal$/i,                   // Common internal TLD
  /\.local$/i,                      // mDNS
  /\.localhost$/i,                  // RFC 6761
  /metadata\.google\.internal$/i,   // GCP metadata
];

/**
 * Validates that a URL is safe to fetch from the server side.
 * 
 * @param urlString - The raw URL string from user input
 * @returns The validated URL object
 * @throws Error if the URL is invalid, uses a blocked protocol, or targets an internal address
 */
export function validateExternalUrl(urlString: string): URL {
  let url: URL;
  
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid URL format.");
  }

  // Protocol check
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Invalid URL protocol. Only HTTP and HTTPS are allowed.");
  }

  // Hostname check against blocklist
  const hostname = url.hostname.toLowerCase();
  
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error(
        "URLs pointing to internal or reserved network addresses are not allowed."
      );
    }
  }

  // Block numeric-only hostnames (raw IPs that might bypass regex)
  // This catches edge cases like 0x7f000001 (127.0.0.1 in hex)
  if (/^[\d.]+$/.test(hostname)) {
    const octets = hostname.split('.').map(Number);
    if (
      octets.length === 4 &&
      octets.every(o => !isNaN(o) && o >= 0 && o <= 255)
    ) {
      // It's a raw IPv4 — re-check the first octet against known private ranges
      const first = octets[0];
      if (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 172 && octets[1] >= 16 && octets[1] <= 31) ||
        (first === 192 && octets[1] === 168) ||
        (first === 169 && octets[1] === 254)
      ) {
        throw new Error(
          "URLs pointing to internal or reserved network addresses are not allowed."
        );
      }
    }
  }

  // Block if port is a well-known internal service port (optional hardening)
  const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80);
  const BLOCKED_PORTS = [6379, 5432, 3306, 27017, 9200, 11211]; // Redis, PG, MySQL, Mongo, ES, Memcached
  if (BLOCKED_PORTS.includes(port)) {
    throw new Error(
      "URLs targeting database or cache service ports are not allowed."
    );
  }

  return url;
}
