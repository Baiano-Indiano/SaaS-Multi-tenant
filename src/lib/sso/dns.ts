import { promisify } from 'util';
import { resolveTxt as resolveTxtCb } from 'dns';

const resolveTxt = promisify(resolveTxtCb);

/**
 * Verifies if a domain has a specific TXT record.
 * Used for domain ownership verification.
 * Includes a timeout to prevent hanging on slow DNS lookups.
 */
export async function verifyDomainTXT(domain: string, expectedToken: string): Promise<boolean> {
  const timeoutMs = 5000;
  const expectedValue = `gravity-verification=${expectedToken}`;

  try {
    const records = await Promise.race([
      resolveTxt(domain),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs)
      )
    ]);

    // records is an array of arrays (string[][])
    // We flatten them and check if any match exactly or contains the expected value
    // (DNS records sometimes have quotes or are split into multiple strings)
    const allTxtEntries = records.flat().map(r => r.trim().replace(/^"|"$/g, ''));
    
    return allTxtEntries.some(record => record === expectedValue);
  } catch (error) {
    // Only log actual errors, not "not found" which is common during propagation
    if (error instanceof Error && !error.message.includes('ENOTFOUND') && !error.message.includes('ENODATA')) {
      console.error(`[DNS Verification Error] ${domain}:`, error.message);
    }
    return false;
  }
}

/**
 * Normalizes a domain name (removes protocol, whitespace, lowercase).
 */
export function normalizeDomain(domain: string): string {
  return domain
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .split('/')[0]
    .toLowerCase()
    .trim();
}
