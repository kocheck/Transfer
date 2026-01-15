/**
 * Layout calculation utilities for Transfer page
 */

import type { ComponentInfo, LayoutResult, LayoutGroup, TransferSettings } from '../types';

/**
 * Calculates optimal layout for components
 * @param components - Map of components to lay out
 * @param settings - Transfer settings
 * @returns Layout result with positions and groups
 */
export function calculateLayout(
  components: Map<string, ComponentInfo>,
  settings: TransferSettings
): LayoutResult {
  const positions = new Map<string, { x: number; y: number }>();
  const groups: LayoutGroup[] = [];

  if (components.size === 0) {
    return { positions, groups, totalWidth: 0, totalHeight: 0 };
  }

  switch (settings.groupingMethod) {
    case 'hierarchy':
      return calculateHierarchicalLayout(components, settings);
    case 'type':
      return calculateTypeBasedLayout(components, settings);
    case 'flat':
      return calculateFlatLayout(components, settings);
    case 'selection':
    default:
      return calculateSelectionBasedLayout(components, settings);
  }
}

/**
 * Calculates hierarchical layout (grouped by parent-child relationships)
 */
function calculateHierarchicalLayout(
  components: Map<string, ComponentInfo>,
  settings: TransferSettings
): LayoutResult {
  const positions = new Map<string, { x: number; y: number }>();
  const groups: LayoutGroup[] = [];

  // Group by hierarchy level
  const levelGroups = new Map<number, ComponentInfo[]>();

  for (const comp of components.values()) {
    const level = comp.level;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(comp);
  }

  let currentY = 0;
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

  for (const level of sortedLevels) {
    const comps = levelGroups.get(level)!;
    const groupName = `Level ${level}`;

    const { positions: groupPositions, totalWidth, totalHeight } = layoutComponentsInGrid(
      comps,
      0,
      currentY,
      settings
    );

    // Add positions
    for (const [id, pos] of groupPositions.entries()) {
      positions.set(id, pos);
    }

    // Add group
    groups.push({
      name: groupName,
      componentIds: comps.map((c) => c.id),
      x: 0,
      y: currentY,
      width: totalWidth,
      height: totalHeight,
    });

    currentY += totalHeight + settings.spacing * 2;
  }

  const totalWidth = Math.max(...groups.map((g) => g.width));
  const totalHeight = currentY;

  return { positions, groups, totalWidth, totalHeight };
}

/**
 * Calculates type-based layout (grouped by component type)
 */
function calculateTypeBasedLayout(
  components: Map<string, ComponentInfo>,
  settings: TransferSettings
): LayoutResult {
  const positions = new Map<string, { x: number; y: number }>();
  const groups: LayoutGroup[] = [];

  // Group by type
  const componentGroups = new Map<string, ComponentInfo[]>();
  const componentSetGroups = new Map<string, ComponentInfo[]>();

  for (const comp of components.values()) {
    if (comp.type === 'COMPONENT_SET') {
      const key = 'Variant Sets';
      if (!componentSetGroups.has(key)) {
        componentSetGroups.set(key, []);
      }
      componentSetGroups.get(key)!.push(comp);
    } else {
      const key = 'Components';
      if (!componentGroups.has(key)) {
        componentGroups.set(key, []);
      }
      componentGroups.get(key)!.push(comp);
    }
  }

  let currentY = 0;

  // Layout variant sets first
  for (const [groupName, comps] of componentSetGroups.entries()) {
    const { positions: groupPositions, totalWidth, totalHeight } = layoutComponentsInGrid(
      comps,
      0,
      currentY,
      settings
    );

    for (const [id, pos] of groupPositions.entries()) {
      positions.set(id, pos);
    }

    groups.push({
      name: groupName,
      componentIds: comps.map((c) => c.id),
      x: 0,
      y: currentY,
      width: totalWidth,
      height: totalHeight,
    });

    currentY += totalHeight + settings.spacing * 2;
  }

  // Then layout regular components
  for (const [groupName, comps] of componentGroups.entries()) {
    const { positions: groupPositions, totalWidth, totalHeight } = layoutComponentsInGrid(
      comps,
      0,
      currentY,
      settings
    );

    for (const [id, pos] of groupPositions.entries()) {
      positions.set(id, pos);
    }

    groups.push({
      name: groupName,
      componentIds: comps.map((c) => c.id),
      x: 0,
      y: currentY,
      width: totalWidth,
      height: totalHeight,
    });

    currentY += totalHeight + settings.spacing * 2;
  }

  const totalWidth = Math.max(...groups.map((g) => g.width));
  const totalHeight = currentY;

  return { positions, groups, totalWidth, totalHeight };
}

/**
 * Calculates flat layout (all components in one grid)
 */
function calculateFlatLayout(
  components: Map<string, ComponentInfo>,
  settings: TransferSettings
): LayoutResult {
  const comps = Array.from(components.values());

  const { positions, totalWidth, totalHeight } = layoutComponentsInGrid(comps, 0, 0, settings);

  const groups: LayoutGroup[] = [
    {
      name: 'All Components',
      componentIds: comps.map((c) => c.id),
      x: 0,
      y: 0,
      width: totalWidth,
      height: totalHeight,
    },
  ];

  return { positions, groups, totalWidth, totalHeight };
}

/**
 * Calculates selection-based layout (maintains selection order)
 */
function calculateSelectionBasedLayout(
  components: Map<string, ComponentInfo>,
  settings: TransferSettings
): LayoutResult {
  // This is essentially the same as flat layout
  // In a real implementation, we'd preserve the original selection order
  return calculateFlatLayout(components, settings);
}

/**
 * Lays out components in a grid
 */
function layoutComponentsInGrid(
  components: ComponentInfo[],
  startX: number,
  startY: number,
  settings: TransferSettings
): { positions: Map<string, { x: number; y: number }>; totalWidth: number; totalHeight: number } {
  const positions = new Map<string, { x: number; y: number }>();

  if (components.length === 0) {
    return { positions, totalWidth: 0, totalHeight: 0 };
  }

  const spacing = settings.spacing;
  const columns = settings.layoutType === 'grid' ? settings.gridColumns : 1;

  // Assume a default size for components (since we don't have actual dimensions here)
  const defaultWidth = 200;
  const defaultHeight = 200;

  let x = startX;
  let y = startY;
  let maxHeightInRow = 0;
  let col = 0;
  let maxX = startX;
  let maxY = startY;

  for (const comp of components) {
    positions.set(comp.id, { x, y });

    maxHeightInRow = Math.max(maxHeightInRow, defaultHeight);
    maxX = Math.max(maxX, x + defaultWidth);
    maxY = Math.max(maxY, y + defaultHeight);

    col++;
    if (col >= columns) {
      // Move to next row
      col = 0;
      x = startX;
      y += maxHeightInRow + spacing;
      maxHeightInRow = 0;
    } else {
      // Move to next column
      x += defaultWidth + spacing;
    }
  }

  const totalWidth = maxX - startX;
  const totalHeight = maxY - startY;

  return { positions, totalWidth, totalHeight };
}

/**
 * Calculates optimal spacing to prevent overlapping
 */
export function calculateOptimalSpacing(componentCount: number, defaultSpacing: number): number {
  // Increase spacing for large component counts
  if (componentCount > 50) {
    return defaultSpacing * 1.5;
  } else if (componentCount > 100) {
    return defaultSpacing * 2;
  }

  return defaultSpacing;
}
