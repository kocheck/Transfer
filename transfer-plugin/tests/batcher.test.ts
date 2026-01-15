/**
 * Tests for batcher utilities
 */

import {
  processBatch,
  delay,
  createCancellationToken,
  throttle,
  debounce,
  estimateProcessingTime,
  estimateTimeRemaining,
} from '../utils/batcher';

describe('Batcher Utilities', () => {
  describe('createCancellationToken', () => {
    it('should create a cancellation token', () => {
      const token = createCancellationToken();
      expect(token.isCancelled).toBe(false);
    });

    it('should cancel when cancel is called', () => {
      const token = createCancellationToken();
      token.cancel();
      expect(token.isCancelled).toBe(true);
    });
  });

  describe('delay', () => {
    it('should delay for specified milliseconds', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });
  });

  describe('processBatch', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const results: number[] = [];

      await processBatch(
        items,
        2,
        (item) => {
          results.push(item * 2);
          return item * 2;
        }
      );

      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should call progress callback', async () => {
      const items = [1, 2, 3, 4];
      const progressUpdates: number[] = [];

      await processBatch(
        items,
        2,
        (item) => item * 2,
        (processed, _total) => {
          progressUpdates.push(processed);
        }
      );

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(4);
    });

    it('should cancel when cancellation token is cancelled', async () => {
      const items = [1, 2, 3, 4, 5];
      const token = createCancellationToken();
      const results: number[] = [];

      setTimeout(() => token.cancel(), 10);

      await expect(
        processBatch(
          items,
          1,
          async (item) => {
            await delay(20);
            results.push(item);
            return item;
          },
          undefined,
          token
        )
      ).rejects.toThrow('Operation cancelled');

      expect(results.length).toBeLessThan(items.length);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      let callCount = 0;
      const throttled = throttle(() => {
        callCount++;
      }, 100);

      // Call multiple times rapidly
      throttled();
      throttled();
      throttled();

      // Should only call once immediately
      expect(callCount).toBe(1);

      setTimeout(() => {
        throttled();
        expect(callCount).toBe(2);
        done();
      }, 150);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const debounced = debounce(() => {
        callCount++;
      }, 50);

      // Call multiple times rapidly
      debounced();
      debounced();
      debounced();

      // Should not call immediately
      expect(callCount).toBe(0);

      setTimeout(() => {
        // Should call once after delay
        expect(callCount).toBe(1);
        done();
      }, 100);
    });
  });

  describe('estimateProcessingTime', () => {
    it('should estimate processing time', () => {
      const estimate = estimateProcessingTime(100, 10);
      expect(estimate).toBe(1000);
    });
  });

  describe('estimateTimeRemaining', () => {
    it('should estimate time remaining', () => {
      const startTime = Date.now() - 1000; // 1 second ago
      const estimate = estimateTimeRemaining(50, 100, startTime);
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThanOrEqual(2000); // Should be around 1 second
    });

    it('should return 0 when nothing processed', () => {
      const estimate = estimateTimeRemaining(0, 100, Date.now());
      expect(estimate).toBe(0);
    });
  });
});
