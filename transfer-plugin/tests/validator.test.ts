/**
 * Tests for validator utilities
 */

import {
  isLocalComponent,
  validateSelection,
  validateComponent,
  validateMainComponent,
  hasTransferableComponents,
} from '../utils/validator';
import {
  setupFigmaMock,
  teardownFigmaMock,
  MockComponentNode,
  MockInstanceNode,
} from './mocks/figma-api';

describe('Validator Utilities', () => {
  beforeEach(() => {
    setupFigmaMock('doc123');
  });

  afterEach(() => {
    teardownFigmaMock();
  });

  describe('isLocalComponent', () => {
    it('should identify local components', () => {
      const localComp = new MockComponentNode('comp1', 'Local', 'doc123_key1');
      expect(isLocalComponent(localComp as any)).toBe(true);
    });

    it('should identify external components', () => {
      const externalComp = new MockComponentNode('comp1', 'External', 'otherdoc_key1');
      expect(isLocalComponent(externalComp as any)).toBe(false);
    });
  });

  describe('validateSelection', () => {
    it('should warn when selection is empty', () => {
      const warnings = validateSelection([]);
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('MISSING_DEFINITION');
    });

    it('should not warn when selection has items', () => {
      const comp = new MockComponentNode('comp1', 'Component', 'doc123_key');
      const warnings = validateSelection([comp as any]);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('validateComponent', () => {
    it('should warn about external components', () => {
      const externalComp = new MockComponentNode('comp1', 'External', 'otherdoc_key');
      const warnings = validateComponent(externalComp as any);

      const externalWarning = warnings.find((w) => w.type === 'EXTERNAL_DEPENDENCY');
      expect(externalWarning).toBeDefined();
    });

    it('should warn about locked components', () => {
      const lockedComp = new MockComponentNode('comp1', 'Locked', 'doc123_key');
      lockedComp.locked = true;
      const warnings = validateComponent(lockedComp as any);

      const lockedWarning = warnings.find((w) => w.type === 'LOCKED_COMPONENT');
      expect(lockedWarning).toBeDefined();
    });

    it('should warn about hidden components', () => {
      const hiddenComp = new MockComponentNode('comp1', 'Hidden', 'doc123_key');
      hiddenComp.visible = false;
      const warnings = validateComponent(hiddenComp as any);

      const hiddenWarning = warnings.find((w) => w.type === 'HIDDEN_COMPONENT');
      expect(hiddenWarning).toBeDefined();
    });

    it('should not warn about valid local components', () => {
      const validComp = new MockComponentNode('comp1', 'Valid', 'doc123_key');
      const warnings = validateComponent(validComp as any);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('validateMainComponent', () => {
    it('should warn when main component is missing', () => {
      const instance = new MockInstanceNode('inst1', 'Instance', null as any);
      instance.mainComponent = null;

      const warning = validateMainComponent(instance as any);
      expect(warning).toBeDefined();
      expect(warning?.type).toBe('MISSING_DEFINITION');
    });

    it('should not warn when main component exists', () => {
      const mainComp = new MockComponentNode('comp1', 'Component', 'doc123_key');
      const instance = new MockInstanceNode('inst1', 'Instance', mainComp);

      const warning = validateMainComponent(instance as any);
      expect(warning).toBeNull();
    });
  });

  describe('hasTransferableComponents', () => {
    it('should return true for local components', () => {
      const localComp = new MockComponentNode('comp1', 'Local', 'doc123_key');
      expect(hasTransferableComponents([localComp as any])).toBe(true);
    });

    it('should return false for external components only', () => {
      const externalComp = new MockComponentNode('comp1', 'External', 'otherdoc_key');
      expect(hasTransferableComponents([externalComp as any])).toBe(false);
    });

    it('should return true for instances of local components', () => {
      const localComp = new MockComponentNode('comp1', 'Local', 'doc123_key');
      const instance = new MockInstanceNode('inst1', 'Instance', localComp);

      expect(hasTransferableComponents([instance as any])).toBe(true);
    });
  });
});
