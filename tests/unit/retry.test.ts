import { calculateExponentialBackoff } from '../../apps/worker/src/processor';

describe('Exponential Backoff Retry Calculation', () => {
  it('should calculate correct exponential backoff delays', () => {
    // baseDelay = 2000ms
    // Attempt 1 -> 2000 * 2^0 = 2000ms
    expect(calculateExponentialBackoff(1, 2000)).toBe(2000);

    // Attempt 2 -> 2000 * 2^1 = 4000ms
    expect(calculateExponentialBackoff(2, 2000)).toBe(4000);

    // Attempt 3 -> 2000 * 2^2 = 8000ms
    expect(calculateExponentialBackoff(3, 2000)).toBe(8000);

    // Attempt 4 -> 2000 * 2^3 = 16000ms
    expect(calculateExponentialBackoff(4, 2000)).toBe(16000);
  });

  it('should handle zero or negative attempt numbers gracefully', () => {
    expect(calculateExponentialBackoff(0, 2000)).toBe(2000);
  });
});
