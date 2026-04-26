import { promisify } from 'util';
import { resolveTxt as resolveTxtCb } from 'dns';

const resolveTxt = promisify(resolveTxtCb);

/**
 * Verifies if a domain has a specific TXT record.
 * Used for domain ownership verification.
 */
export async function verifyDomainTXT(domain: string, expectedToken: string): Promise<boolean> {
  try {
    const records = await resolveTxt(domain);
    // records is an array of arrays (each TXT record can have multiple strings)
    // We flatten them and check if any match "gravity-verification=<token>"
    const flattenedRecords = records.flat();
    const expectedValue = `gravity-verification=${expectedToken}`;
    
    return flattenedRecords.some(record => record.trim() === expectedValue);
  } catch (error) {
    console.error(`DNS verification failed for ${domain}:`, error);
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
