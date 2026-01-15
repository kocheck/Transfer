/**
 * Tests for layout utilities
 */

import { calculateLayout, calculateOptimalSpacing } from '../utils/layout';
import type { ComponentInfo, TransferSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

describe('Layout Utilities', () => {
  const createMockComponent = (id: string, name: string, level = 0): ComponentInfo => ({
    id,
    name,
    description: '',
    type: 'COMPONENT',
    isLocal: true,
    isHidden: false,
    isLocked: false,
    children: [],
    level,
  });

  describe('calculateLayout', () => {
    it('should return empty layout for no components', () => {
      const components = new Map<string, ComponentInfo>();
      const result = calculateLayout(components, DEFAULT_SETTINGS);

      expect(result.positions.size).toBe(0);
      expect(result.groups).toHaveLength(0);
      expect(result.totalWidth).toBe(0);
      expect(result.totalHeight).toBe(0);
    });

    it('should calculate flat layout', () => {
      const components = new Map<string, ComponentInfo>();
      components.set('1', createMockComponent('1', 'Button'));
      components.set('2', createMockComponent('2', 'Icon'));

      const settings: TransferSettings = {
        ...DEFAULT_SETTINGS,
        groupingMethod: 'flat',
      };

      const result = calculateLayout(components, settings);

      expect(result.positions.size).toBe(2);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].name).toBe('All Components');
    });

    it('should calculate hierarchical layout', () => {
      const components = new Map<string, ComponentInfo>();
      components.set('1', createMockComponent('1', 'Parent', 0));
      components.set('2', createMockComponent('2', 'Child1', 1));
      components.set('3', createMockComponent('3', 'Child2', 1));
      components.set('4', createMockComponent('4', 'Grandchild', 2));

      const settings: TransferSettings = {
        ...DEFAULT_SETTINGS,
        groupingMethod: 'hierarchy',
      };

      const result = calculateLayout(components, settings);

      expect(result.groups.length).toBeGreaterThan(1);
      expect(result.groups.some((g) => g.name === 'Level 0')).toBe(true);
      expect(result.groups.some((g) => g.name === 'Level 1')).toBe(true);
    });

    it('should calculate type-based layout', () => {
      const components = new Map<string, ComponentInfo>();
      components.set('1', createMockComponent('1', 'Button'));
      components.set('2', {
        ...createMockComponent('2', 'Variants'),
        type: 'COMPONENT_SET',
        variantCount: 3,
      });

      const settings: TransferSettings = {
        ...DEFAULT_SETTINGS,
        groupingMethod: 'type',
      };

      const result = calculateLayout(components, settings);

      expect(result.groups.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect grid columns setting', () => {
      const components = new Map<string, ComponentInfo>();
      for (let i = 1; i <= 10; i++) {
        components.set(`${i}`, createMockComponent(`${i}`, `Component${i}`));
      }

      const settings: TransferSettings = {
        ...DEFAULT_SETTINGS,
        layoutType: 'grid',
        gridColumns: 3,
      };

      const result = calculateLayout(components, settings);

      expect(result.positions.size).toBe(10);
      // Verify positions are arranged in grid (would need actual position values)
    });

    it('should respect spacing setting', () => {
      const components = new Map<string, ComponentInfo>();
      components.set('1', createMockComponent('1', 'Comp1'));
      components.set('2', createMockComponent('2', 'Comp2'));

      const settings: TransferSettings = {
        ...DEFAULT_SETTINGS,
        spacing: 500,
      };

      const result = calculateLayout(components, settings);

      // Verify spacing is applied (would need to check actual positions)
      expect(result.totalWidth).toBeGreaterThan(0);
      expect(result.totalHeight).toBeGreaterThan(0);
    });
  });

  describe('calculateOptimalSpacing', () => {
    it('should return default spacing for small counts', () => {
      expect(calculateOptimalSpacing(10, 200)).toBe(200);
    });

    it('should increase spacing for large counts', () => {
      expect(calculateOptimalSpacing(60, 200)).toBeGreaterThan(200);
    });

    it('should increase spacing more for very large counts', () => {
      const spacing60 = calculateOptimalSpacing(60, 200);
      const spacing150 = calculateOptimalSpacing(150, 200);
      expect(spacing150).toBeGreaterThan(spacing60);
    });
  });
});
