/**
 * Utilities for tracking and reporting progress
 */

import type { ProgressInfo } from '../types';
import { estimateTimeRemaining } from './batcher';

/**
 * Progress tracker class
 */
export class ProgressTracker {
  private phase: ProgressInfo['phase'] = 'analyzing';
  private processed = 0;
  private total = 0;
  private startTime = 0;
  private currentItem = '';
  private callback?: (progress: ProgressInfo) => void;

  constructor(callback?: (progress: ProgressInfo) => void) {
    this.callback = callback;
  }

  /**
   * Starts tracking progress
   * @param total - Total number of items to process
   * @param phase - Current processing phase
   */
  start(total: number, phase: ProgressInfo['phase'] = 'analyzing'): void {
    this.total = total;
    this.phase = phase;
    this.processed = 0;
    this.startTime = Date.now();
    this.update();
  }

  /**
   * Updates the current phase
   * @param phase - New phase
   */
  setPhase(phase: ProgressInfo['phase']): void {
    this.phase = phase;
    this.update();
  }

  /**
   * Updates progress
   * @param processed - Number of items processed
   * @param currentItem - Name of current item being processed
   */
  updateProgress(processed: number, currentItem = ''): void {
    this.processed = processed;
    this.currentItem = currentItem;
    this.update();
  }

  /**
   * Increments progress by one
   * @param currentItem - Name of current item being processed
   */
  increment(currentItem = ''): void {
    this.processed++;
    this.currentItem = currentItem;
    this.update();
  }

  /**
   * Gets current progress information
   * @returns Progress info object
   */
  getProgress(): ProgressInfo {
    const percentage = this.total > 0 ? Math.round((this.processed / this.total) * 100) : 0;
    const estimatedTimeRemaining = estimateTimeRemaining(
      this.processed,
      this.total,
      this.startTime
    );

    return {
      phase: this.phase,
      percentage,
      currentItem: this.currentItem,
      processed: this.processed,
      total: this.total,
      estimatedTimeRemaining,
    };
  }

  /**
   * Sends progress update to callback
   */
  private update(): void {
    if (this.callback) {
      this.callback(this.getProgress());
    }
  }

  /**
   * Marks progress as complete
   */
  complete(): void {
    this.processed = this.total;
    this.update();
  }
}

/**
 * Formats milliseconds to human-readable time
 * @param ms - Milliseconds
 * @returns Formatted time string
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Formats a progress percentage
 * @param processed - Number processed
 * @param total - Total number
 * @returns Formatted percentage string
 */
export function formatPercentage(processed: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((processed / total) * 100)}%`;
}

/**
 * Creates a simple text progress bar
 * @param percentage - Progress percentage (0-100)
 * @param width - Width of the progress bar in characters
 * @returns Progress bar string
 */
export function createProgressBar(percentage: number, width = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${' '.repeat(empty)}] ${percentage}%`;
}
