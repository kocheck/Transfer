/**
 * Utilities for batch processing to maintain UI responsiveness
 */

import type { CancellationToken } from '../types';

/**
 * Creates a cancellation token
 * @returns A new cancellation token
 */
export function createCancellationToken(): CancellationToken {
  return {
    isCancelled: false,
    cancel() {
      this.isCancelled = true;
    },
  };
}

/**
 * Processes an array in batches with delays to keep UI responsive
 * @param items - Array of items to process
 * @param batchSize - Number of items to process in each batch
 * @param processor - Function to process each item
 * @param onProgress - Optional progress callback
 * @param cancellationToken - Optional cancellation token
 * @returns Promise that resolves when all items are processed
 */
export async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => R | Promise<R>,
  onProgress?: (processed: number, total: number) => void,
  cancellationToken?: CancellationToken
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += batchSize) {
    // Check for cancellation
    if (cancellationToken?.isCancelled) {
      throw new Error('Operation cancelled');
    }

    const batch = items.slice(i, Math.min(i + batchSize, total));

    // Process batch
    for (let j = 0; j < batch.length; j++) {
      const result = await processor(batch[j], i + j);
      results.push(result);
    }

    // Update progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }

    // Yield to UI thread
    if (i + batchSize < total) {
      await delay(0);
    }
  }

  return results;
}

/**
 * Delays execution for the specified milliseconds
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Processes items in chunks asynchronously
 * @param items - Array of items to process
 * @param chunkSize - Size of each chunk
 * @param processor - Async function to process each chunk
 * @param onProgress - Optional progress callback
 * @param cancellationToken - Optional cancellation token
 */
export async function processInChunks<T, R>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[], startIndex: number) => Promise<R>,
  onProgress?: (processed: number, total: number) => void,
  cancellationToken?: CancellationToken
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += chunkSize) {
    // Check for cancellation
    if (cancellationToken?.isCancelled) {
      throw new Error('Operation cancelled');
    }

    const chunk = items.slice(i, Math.min(i + chunkSize, total));
    const result = await processor(chunk, i);
    results.push(result);

    // Update progress
    if (onProgress) {
      onProgress(Math.min(i + chunkSize, total), total);
    }

    // Yield to UI thread
    await delay(0);
  }

  return results;
}

/**
 * Throttles a function to run at most once per specified interval
 * @param func - Function to throttle
 * @param intervalMs - Minimum interval between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= intervalMs) {
      lastCall = now;
      func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, intervalMs - (now - lastCall));
    }
  };
}

/**
 * Debounces a function to run only after it hasn't been called for specified time
 * @param func - Function to debounce
 * @param waitMs - Milliseconds to wait before calling
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Estimates processing time based on item count
 * @param itemCount - Number of items to process
 * @param averageTimePerItem - Average time per item in milliseconds
 * @returns Estimated time in milliseconds
 */
export function estimateProcessingTime(itemCount: number, averageTimePerItem: number): number {
  return itemCount * averageTimePerItem;
}

/**
 * Calculates estimated time remaining
 * @param processed - Number of items processed
 * @param total - Total number of items
 * @param startTime - Start timestamp
 * @returns Estimated milliseconds remaining
 */
export function estimateTimeRemaining(processed: number, total: number, startTime: number): number {
  if (processed === 0) return 0;

  const elapsed = Date.now() - startTime;
  const averageTimePerItem = elapsed / processed;
  const remaining = total - processed;

  return Math.round(remaining * averageTimePerItem);
}
