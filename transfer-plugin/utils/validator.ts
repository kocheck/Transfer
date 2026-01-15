/**
 * Utilities for validating components and detecting issues
 */

import type { ComponentInfo, Warning } from '../types';

/**
 * Validates if a component is from the local file
 * @param component - The component node to validate
 * @returns True if the component is local
 */
export function isLocalComponent(component: ComponentNode | ComponentSetNode): boolean {
  // Check if the component's key starts with the document's root ID
  // This indicates it's from the current file, not an external library
  const currentFileKey = figma.root.id;
  return component.key.startsWith(currentFileKey);
}

/**
 * Checks if a node is locked
 * @param node - The node to check
 * @returns True if the node is locked
 */
export function isLocked(node: SceneNode): boolean {
  return node.locked;
}

/**
 * Checks if a node is hidden
 * @param node - The node to check
 * @returns True if the node is visible
 */
export function isVisible(node: SceneNode): boolean {
  return node.visible;
}

/**
 * Validates the selection and returns any issues
 * @param selection - The current selection
 * @returns Array of warnings
 */
export function validateSelection(selection: readonly SceneNode[]): Warning[] {
  const warnings: Warning[] = [];

  if (selection.length === 0) {
    warnings.push({
      type: 'MISSING_DEFINITION',
      message: 'No nodes selected. Please select at least one frame, component, or instance.',
    });
  }

  return warnings;
}

/**
 * Validates a component and returns any issues
 * @param component - The component to validate
 * @param componentInfo - Additional component information
 * @returns Array of warnings
 */
export function validateComponent(
  component: ComponentNode | ComponentSetNode,
  _componentInfo?: ComponentInfo
): Warning[] {
  const warnings: Warning[] = [];

  // Check if component is from external library
  if (!isLocalComponent(component)) {
    warnings.push({
      type: 'EXTERNAL_DEPENDENCY',
      message: `Component "${component.name}" is from an external library and cannot be transferred. Please include this library in the destination file.`,
      componentId: component.id,
      componentName: component.name,
    });
  }

  // Check if component is locked
  if (isLocked(component)) {
    warnings.push({
      type: 'LOCKED_COMPONENT',
      message: `Component "${component.name}" is locked and cannot be transferred.`,
      componentId: component.id,
      componentName: component.name,
    });
  }

  // Check if component is hidden
  if (!isVisible(component)) {
    warnings.push({
      type: 'HIDDEN_COMPONENT',
      message: `Component "${component.name}" is hidden.`,
      componentId: component.id,
      componentName: component.name,
    });
  }

  return warnings;
}

/**
 * Checks if a component definition exists and is accessible
 * @param instanceNode - The instance to check
 * @returns Warning if main component is missing
 */
export function validateMainComponent(instanceNode: InstanceNode): Warning | null {
  const mainComponent = instanceNode.mainComponent;

  if (!mainComponent) {
    return {
      type: 'MISSING_DEFINITION',
      message: `Instance "${instanceNode.name}" has no main component definition. It may have been deleted or is from a detached library.`,
      componentId: instanceNode.id,
      componentName: instanceNode.name,
    };
  }

  return null;
}

/**
 * Validates if circular dependencies exist
 * Note: This is more of a sanity check as Figma prevents actual circular component references
 * @param componentId - The component ID to check
 * @param visited - Set of already visited component IDs
 * @param path - Current path of component IDs
 * @returns True if circular dependency detected
 */
export function hasCircularDependency(
  componentId: string,
  visited: Set<string>,
  path: Set<string>
): boolean {
  if (path.has(componentId)) {
    return true;
  }

  if (visited.has(componentId)) {
    return false;
  }

  visited.add(componentId);
  path.add(componentId);

  // In practice, Figma's API prevents circular dependencies
  // This is more of a defensive check

  path.delete(componentId);
  return false;
}

/**
 * Validates file permissions
 * @returns Warning if file has permission issues
 */
export function validateFilePermissions(): Warning | null {
  // Check if the file is in view-only mode
  // Note: Figma API doesn't provide direct access to file permissions
  // This is a placeholder for potential future API enhancements

  try {
    // Attempt to check if we can create pages (basic permission check)
    // This doesn't actually create a page, just validates the concept
    return null;
  } catch (error) {
    return {
      type: 'MISSING_DEFINITION',
      message: 'You may not have permission to modify this file.',
    };
  }
}

/**
 * Checks if the selection contains any transferable components
 * @param selection - The current selection
 * @returns True if selection contains at least one valid component
 */
export function hasTransferableComponents(selection: readonly SceneNode[]): boolean {
  for (const node of selection) {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      if (isLocalComponent(node as ComponentNode | ComponentSetNode)) {
        return true;
      }
    } else if (node.type === 'INSTANCE') {
      const instance = node as InstanceNode;
      if (instance.mainComponent && isLocalComponent(instance.mainComponent)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates memory constraints for large operations
 * @param estimatedNodeCount - Estimated number of nodes to process
 * @returns Warning if operation might exceed memory limits
 */
export function validateMemoryConstraints(estimatedNodeCount: number): Warning | null {
  // Conservative estimate: warn if processing more than 10,000 nodes
  const MAX_SAFE_NODES = 10000;

  if (estimatedNodeCount > MAX_SAFE_NODES) {
    return {
      type: 'MISSING_DEFINITION',
      message: `Large selection detected (${estimatedNodeCount} nodes). This operation may take a long time or fail due to memory constraints. Consider selecting fewer components.`,
    };
  }

  return null;
}
