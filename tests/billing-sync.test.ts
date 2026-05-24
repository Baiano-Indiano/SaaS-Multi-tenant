import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../src/app/api/cron/billing-sync/route';
import { redis } from '../src/lib/redis';
import { db } from '../src/lib/db';
import { getUsage, incrementUsage } from '../src/lib/billing/telemetry';
import Stripe from 'stripe';

// Mock dependencies
vi.mock('../src/lib/redis', () => ({
  redis: {
    keys: vi.fn(),
  },
}));

vi.mock('../src/lib/billing/telemetry', () => ({
  getUsage: vi.fn(),
  incrementUsage: vi.fn(),
}));

vi.mock('../src/lib/db', () => {
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue({}),
    query: {
      organizations: {
        findFirst: vi.fn(),
      },
    },
  };
  return { db: mockDb };
});

const { mockStripe } = vi.hoisted(() => ({
  mockStripe: {
    subscriptions: {
      retrieve: vi.fn(),
    },
    subscriptionItems: {
      createUsageRecord: vi.fn(),
    },
  }
}));

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return mockStripe;
    }),
  };
});

describe('Billing Sync Cron Route (GET /api/cron/billing-sync)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-cron-secret';
  });

  const createReq = (authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set('authorization', authHeader);
    }
    return new Request('http://localhost:3000/api/cron/billing-sync', {
      headers,
    });
  };

  it('should return 401 if authorization header is missing or incorrect', async () => {
    const req1 = createReq();
    const res1 = await GET(req1);
    expect(res1.status).toBe(401);

    const req2 = createReq('Bearer wrong-secret');
    const res2 = await GET(req2);
    expect(res2.status).toBe(401);
  });

  it('should process pending usage keys successfully', async () => {
    // 1. Mock Redis keys scan
    vi.mocked(redis.keys).mockResolvedValue([
      'billing:usage:org_123:api_calls',
      'billing:usage:org_456:workflow_triggers',
    ]);

    // 2. Mock usage amounts
    vi.mocked(getUsage).mockImplementation(async (orgId, metric) => {
      if (orgId === 'org_123') return 150;
      if (orgId === 'org_456') return 45;
      return 0;
    });

    // 3. Mock organization query (one has Stripe subscription, one does not)
    let callCount = 0;
    (db.query.organizations.findFirst as any).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { stripeSubscriptionId: 'sub_123' };
      }
      return null; // org_456 is on free plan
    });

    // 4. Mock Stripe subscription and usage report
    vi.mocked(mockStripe.subscriptions.retrieve).mockResolvedValue({
      items: {
        data: [
          { id: 'si_123', price: { id: 'price_1TOSUBKgmt5iTW4YMetered' } },
        ],
      },
    } as any);

    const req = createReq('Bearer test-cron-secret');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.processed).toBe(2);
    expect(data.synced).toBe(2);
    expect(data.failed).toBe(0);

    // Verify DB insert called for both orgs
    expect(db.insert).toHaveBeenCalledTimes(2);

    // Verify Stripe usage reported only for org_123
    expect((mockStripe.subscriptionItems as any).createUsageRecord).toHaveBeenCalledTimes(1);
    expect((mockStripe.subscriptionItems as any).createUsageRecord).toHaveBeenCalledWith(
      'si_123',
      expect.objectContaining({
        quantity: 150,
        action: 'increment',
      })
    );

    // Verify Redis decrement called for both
    expect(incrementUsage).toHaveBeenCalledTimes(2);
    expect(incrementUsage).toHaveBeenCalledWith('org_123', 'api_calls', -150);
    expect(incrementUsage).toHaveBeenCalledWith('org_456', 'workflow_triggers', -45);
  });

  it('should continue processing other keys if one fails', async () => {
    vi.mocked(redis.keys).mockResolvedValue([
      'billing:usage:org_123:api_calls',
      'billing:usage:org_456:workflow_triggers',
    ]);

    vi.mocked(getUsage).mockImplementation(async (orgId, metric) => {
      if (orgId === 'org_123') return 100;
      if (orgId === 'org_456') return 50;
      return 0;
    });

    // Mock DB insert to fail for org_123 and succeed for org_456
    vi.mocked(db.insert).mockImplementationOnce(() => {
      throw new Error('Database connection failed');
    });

    vi.mocked(db.query.organizations.findFirst as any).mockResolvedValue(undefined as any);

    const req = createReq('Bearer test-cron-secret');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.processed).toBe(2);
    expect(data.synced).toBe(1);
    expect(data.failed).toBe(1);
    expect(data.errors.length).toBe(1);
    expect(data.errors[0].key).toBe('billing:usage:org_123:api_calls');
    expect(data.errors[0].error).toBe('Database connection failed');

    // Verify that org_456 was successfully decremented in Redis
    expect(incrementUsage).toHaveBeenCalledTimes(1);
    expect(incrementUsage).toHaveBeenCalledWith('org_456', 'workflow_triggers', -50);
  });
});
