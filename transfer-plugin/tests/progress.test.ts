/**
 * Tests for progress utilities
 */

import { ProgressTracker, formatTime, formatPercentage } from '../utils/progress';

describe('Progress Utilities', () => {
  describe('ProgressTracker', () => {
    it('should track progress correctly', () => {
      const tracker = new ProgressTracker();
      tracker.start(100, 'analyzing');

      const progress = tracker.getProgress();
      expect(progress.phase).toBe('analyzing');
      expect(progress.total).toBe(100);
      expect(progress.processed).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should update progress', () => {
      const tracker = new ProgressTracker();
      tracker.start(100, 'collecting');
      tracker.updateProgress(50, 'Component 1');

      const progress = tracker.getProgress();
      expect(progress.processed).toBe(50);
      expect(progress.percentage).toBe(50);
      expect(progress.currentItem).toBe('Component 1');
    });

    it('should increment progress', () => {
      const tracker = new ProgressTracker();
      tracker.start(10, 'organizing');

      tracker.increment('Item 1');
      tracker.increment('Item 2');
      tracker.increment('Item 3');

      const progress = tracker.getProgress();
      expect(progress.processed).toBe(3);
      expect(progress.percentage).toBe(30);
    });

    it('should change phases', () => {
      const tracker = new ProgressTracker();
      tracker.start(100, 'analyzing');
      tracker.setPhase('collecting');

      const progress = tracker.getProgress();
      expect(progress.phase).toBe('collecting');
    });

    it('should call callback on updates', () => {
      const updates: any[] = [];
      const tracker = new ProgressTracker((progress) => {
        updates.push(progress);
      });

      tracker.start(10, 'analyzing');
      tracker.increment();
      tracker.increment();

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[updates.length - 1].processed).toBe(2);
    });

    it('should mark as complete', () => {
      const tracker = new ProgressTracker();
      tracker.start(100, 'finalizing');
      tracker.complete();

      const progress = tracker.getProgress();
      expect(progress.processed).toBe(100);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('formatTime', () => {
    it('should format milliseconds', () => {
      expect(formatTime(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatTime(5000)).toBe('5s');
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(125000)).toBe('2m 5s');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      expect(formatPercentage(25, 100)).toBe('25%');
      expect(formatPercentage(50, 100)).toBe('50%');
      expect(formatPercentage(75, 100)).toBe('75%');
    });

    it('should handle zero total', () => {
      expect(formatPercentage(0, 0)).toBe('0%');
    });

    it('should round to nearest integer', () => {
      expect(formatPercentage(33, 100)).toBe('33%');
      expect(formatPercentage(66, 100)).toBe('66%');
    });
  });
});
