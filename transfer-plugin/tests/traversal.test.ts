/**
 * Tests for traversal utilities
 */

import { traverseNode, findNodesByType, findComponentInstances, getNodeDepth } from '../utils/traversal';
import {
  setupFigmaMock,
  teardownFigmaMock,
  MockNode,
  MockComponentNode,
  MockInstanceNode,
} from './mocks/figma-api';

describe('Traversal Utilities', () => {
  beforeEach(() => {
    setupFigmaMock();
  });

  afterEach(() => {
    teardownFigmaMock();
  });

  describe('traverseNode', () => {
    it('should traverse all nodes in a tree', () => {
      const frame = new MockNode('frame1', 'Frame', 'FRAME');
      const child1 = new MockNode('child1', 'Child1', 'RECTANGLE');
      const child2 = new MockNode('child2', 'Child2', 'RECTANGLE');
      const grandchild = new MockNode('grandchild1', 'Grandchild', 'ELLIPSE');

      frame.appendChild(child1);
      frame.appendChild(child2);
      child1.appendChild(grandchild);

      const visited: string[] = [];
      traverseNode(frame as any, (node) => {
        visited.push(node.id);
      });

      expect(visited).toEqual(['frame1', 'child1', 'grandchild1', 'child2']);
    });

    it('should handle nodes with no children', () => {
      const node = new MockNode('single', 'Single', 'RECTANGLE');

      const visited: string[] = [];
      traverseNode(node as any, (node) => {
        visited.push(node.id);
      });

      expect(visited).toEqual(['single']);
    });
  });

  describe('findNodesByType', () => {
    it('should find all nodes of a specific type', () => {
      const frame = new MockNode('frame1', 'Frame', 'FRAME');
      const rect1 = new MockNode('rect1', 'Rect1', 'RECTANGLE');
      const rect2 = new MockNode('rect2', 'Rect2', 'RECTANGLE');
      const ellipse = new MockNode('ellipse1', 'Ellipse', 'ELLIPSE');

      frame.appendChild(rect1);
      frame.appendChild(rect2);
      frame.appendChild(ellipse);

      const rectangles = findNodesByType(frame as any, 'RECTANGLE');

      expect(rectangles).toHaveLength(2);
      expect(rectangles.map((n) => n.id)).toEqual(['rect1', 'rect2']);
    });
  });

  describe('findComponentInstances', () => {
    it('should find all component instances', () => {
      const mainComp = new MockComponentNode('comp1', 'Component', 'key1');
      const frame = new MockNode('frame1', 'Frame', 'FRAME');
      const instance1 = new MockInstanceNode('inst1', 'Instance1', mainComp);
      const instance2 = new MockInstanceNode('inst2', 'Instance2', mainComp);

      frame.appendChild(instance1);
      frame.appendChild(instance2);

      const instances = findComponentInstances(frame as any);

      expect(instances).toHaveLength(2);
      expect(instances.map((n) => n.id)).toEqual(['inst1', 'inst2']);
    });
  });

  describe('getNodeDepth', () => {
    it('should calculate node depth correctly', () => {
      const page = new MockNode('page', 'Page', 'PAGE');
      const frame = new MockNode('frame', 'Frame', 'FRAME');
      const child = new MockNode('child', 'Child', 'RECTANGLE');

      page.appendChild(frame);
      frame.appendChild(child);

      // Depth from page (page itself is depth 0)
      expect(getNodeDepth(page as any)).toBe(0);
      expect(getNodeDepth(frame as any)).toBe(1);
      expect(getNodeDepth(child as any)).toBe(2);
    });
  });
});
