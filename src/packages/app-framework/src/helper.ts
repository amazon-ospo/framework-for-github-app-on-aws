import { createHash } from 'crypto';

/**
 * GitHub tokens are hashed using SHA-256 and encoded in base64
 *
 * Source: https://docs.github.com/en/enterprise-cloud@latest/admin/monitoring-activity-in-your-enterprise/reviewing-audit-logs-for-your-enterprise/identifying-audit-log-events-performed-by-an-access-token#generating-a-sha-256-hash-value-for-a-token
 */
export function getHashedToken(token: string) {
  return createHash('sha256').update(token).digest('base64');
}
