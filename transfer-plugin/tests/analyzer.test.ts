/**
 * Tests for analyzer utilities
 */

import { analyzeSelection, filterComponents } from '../utils/analyzer';
import {
  setupFigmaMock,
  teardownFigmaMock,
  MockComponentNode,
  MockInstanceNode,
  MockNode,
  MockComponentSetNode,
} from './mocks/figma-api';

describe('Analyzer Utilities', () => {
  beforeEach(() => {
    setupFigmaMock('doc123');
  });

  afterEach(() => {
    teardownFigmaMock();
  });

  describe('analyzeSelection', () => {
    it('should analyze a simple component', () => {
      const comp = new MockComponentNode('comp1', 'Button', 'doc123_key1');
      const result = analyzeSelection([comp as any]);

      expect(result.components.size).toBe(1);
      expect(result.stats.totalComponents).toBe(1);
      expect(result.stats.externalComponents).toBe(0);
    });

    it('should find nested component instances', () => {
      const iconComp = new MockComponentNode('icon', 'Icon', 'doc123_icon');
      const buttonComp = new MockComponentNode('button', 'Button', 'doc123_button');
      const iconInstance = new MockInstanceNode('iconInst', 'IconInstance', iconComp);

      buttonComp.appendChild(iconInstance);

      const result = analyzeSelection([buttonComp as any]);

      expect(result.components.size).toBe(2); // Button and Icon
      expect(result.components.has('button')).toBe(true);
      expect(result.components.has('icon')).toBe(true);
    });

    it('should identify external components', () => {
      const externalComp = new MockComponentNode('comp1', 'External', 'otherdoc_key');
      const result = analyzeSelection([externalComp as any], { includeExternal: true, includeHidden: false });

      expect(result.stats.externalComponents).toBe(1);
      expect(result.warnings.some((w) => w.type === 'EXTERNAL_DEPENDENCY')).toBe(true);
    });

    it('should skip hidden components when includeHidden is false', () => {
      const hiddenComp = new MockComponentNode('comp1', 'Hidden', 'doc123_key');
      hiddenComp.visible = false;

      const result = analyzeSelection([hiddenComp as any], { includeHidden: false, includeExternal: false });

      expect(result.components.size).toBe(0);
    });

    it('should include hidden components when includeHidden is true', () => {
      const hiddenComp = new MockComponentNode('comp1', 'Hidden', 'doc123_key');
      hiddenComp.visible = false;

      const result = analyzeSelection([hiddenComp as any], { includeHidden: true, includeExternal: false });

      expect(result.components.size).toBe(1);
      expect(result.stats.hiddenComponents).toBe(1);
    });

    it('should handle component sets (variants)', () => {
      const variantSet = new MockComponentSetNode('varSet', 'ButtonVariants', 'doc123_varset');
      const variant1 = new MockComponentNode('var1', 'Primary', 'doc123_var1');
      const variant2 = new MockComponentNode('var2', 'Secondary', 'doc123_var2');

      variantSet.appendChild(variant1);
      variantSet.appendChild(variant2);

      const result = analyzeSelection([variantSet as any]);

      expect(result.stats.variantSets).toBe(1);
      expect(result.components.get('varSet')?.type).toBe('COMPONENT_SET');
    });

    it('should handle instances of components', () => {
      const mainComp = new MockComponentNode('comp', 'Button', 'doc123_button');
      const instance = new MockInstanceNode('inst', 'ButtonInstance', mainComp);

      const result = analyzeSelection([instance as any]);

      expect(result.components.size).toBe(1);
      expect(result.components.has('comp')).toBe(true);
    });

    it('should deduplicate components', () => {
      const comp = new MockComponentNode('comp', 'Button', 'doc123_button');
      const instance1 = new MockInstanceNode('inst1', 'Instance1', comp);
      const instance2 = new MockInstanceNode('inst2', 'Instance2', comp);

      const result = analyzeSelection([instance1 as any, instance2 as any]);

      expect(result.components.size).toBe(1); // Only one Button component
    });

    it('should handle frames with nested instances', () => {
      const frame = new MockNode('frame', 'Frame', 'FRAME');
      const comp = new MockComponentNode('comp', 'Icon', 'doc123_icon');
      const instance = new MockInstanceNode('inst', 'IconInstance', comp);

      frame.appendChild(instance);

      const result = analyzeSelection([frame as any]);

      expect(result.components.size).toBe(1);
      expect(result.components.has('comp')).toBe(true);
    });

    it('should warn on missing main components', () => {
      const instance = new MockInstanceNode('inst', 'BrokenInstance', null as any);
      instance.mainComponent = null;

      const result = analyzeSelection([instance as any]);

      expect(result.warnings.some((w) => w.type === 'MISSING_DEFINITION')).toBe(true);
    });
  });

  describe('filterComponents', () => {
    it('should filter components by search term', () => {
      const components = new Map();
      components.set('1', {
        id: '1',
        name: 'Button Primary',
        description: 'Primary action button',
        type: 'COMPONENT',
        isLocal: true,
        isHidden: false,
        isLocked: false,
        children: [],
        level: 0,
      });
      components.set('2', {
        id: '2',
        name: 'Icon Arrow',
        description: 'Arrow icon',
        type: 'COMPONENT',
        isLocal: true,
        isHidden: false,
        isLocked: false,
        children: [],
        level: 0,
      });

      const filtered = filterComponents(components, 'button');
      expect(filtered.size).toBe(1);
      expect(filtered.has('1')).toBe(true);
    });

    it('should return all components when search term is empty', () => {
      const components = new Map();
      components.set('1', {
        id: '1',
        name: 'Component 1',
        description: '',
        type: 'COMPONENT',
        isLocal: true,
        isHidden: false,
        isLocked: false,
        children: [],
        level: 0,
      });

      const filtered = filterComponents(components, '');
      expect(filtered.size).toBe(1);
    });

    it('should search in descriptions', () => {
      const components = new Map();
      components.set('1', {
        id: '1',
        name: 'Component',
        description: 'Primary action button',
        type: 'COMPONENT',
        isLocal: true,
        isHidden: false,
        isLocked: false,
        children: [],
        level: 0,
      });

      const filtered = filterComponents(components, 'action');
      expect(filtered.size).toBe(1);
    });
  });
});
