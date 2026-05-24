import { describe, it, expect, vi, beforeEach } from 'vitest';
import { incrementUsage, getUsage, flushUsage, getTelemetryKey } from '../src/lib/billing/telemetry';
import { redis } from '../src/lib/redis';

vi.mock('../src/lib/redis', () => ({
  redis: {
    incrby: vi.fn(),
    get: vi.fn(),
    getset: vi.fn(),
  },
}));

describe('Telemetry Logic (src/lib/billing/telemetry.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build correct telemetry key', () => {
    const key = getTelemetryKey('org_123', 'api_calls');
    expect(key).toBe('billing:usage:org_123:api_calls');
  });

  it('should call redis.incrby on incrementUsage', async () => {
    vi.mocked(redis.incrby).mockResolvedValue(5);
    const result = await incrementUsage('org_123', 'api_calls', 2);
    expect(redis.incrby).toHaveBeenCalledWith('billing:usage:org_123:api_calls', 2);
    expect(result).toBe(5);
  });

  it('should get correct usage value on getUsage', async () => {
    vi.mocked(redis.get).mockResolvedValue(10);
    const result = await getUsage('org_123', 'api_calls');
    expect(redis.get).toHaveBeenCalledWith('billing:usage:org_123:api_calls');
    expect(result).toBe(10);
  });

  it('should handle string values on getUsage', async () => {
    vi.mocked(redis.get).mockResolvedValue("15");
    const result = await getUsage('org_123', 'api_calls');
    expect(result).toBe(15);
  });

  it('should handle null values on getUsage', async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    const result = await getUsage('org_123', 'api_calls');
    expect(result).toBe(0);
  });

  it('should call redis.getset on flushUsage', async () => {
    vi.mocked(redis.getset).mockResolvedValue(20);
    const result = await flushUsage('org_123', 'api_calls');
    expect(redis.getset).toHaveBeenCalledWith('billing:usage:org_123:api_calls', 0);
    expect(result).toBe(20);
  });

  it('should handle null values on flushUsage', async () => {
    vi.mocked(redis.getset).mockResolvedValue(null);
    const result = await flushUsage('org_123', 'api_calls');
    expect(result).toBe(0);
  });
});
