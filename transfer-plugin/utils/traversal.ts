/**
 * Utilities for traversing Figma node trees
 */

/**
 * Recursively traverses a node and all its children
 * @param node - The starting node
 * @param callback - Function to call for each node
 */
export function traverseNode(node: SceneNode, callback: (node: SceneNode) => void): void {
  callback(node);

  if ('children' in node) {
    for (const child of node.children) {
      traverseNode(child, callback);
    }
  }
}

/**
 * Finds all nodes of a specific type in a tree
 * @param node - The starting node
 * @param nodeType - The type of nodes to find
 * @returns Array of matching nodes
 */
export function findNodesByType<T extends SceneNode>(
  node: SceneNode,
  nodeType: NodeType
): T[] {
  const results: T[] = [];

  traverseNode(node, (n) => {
    if (n.type === nodeType) {
      results.push(n as T);
    }
  });

  return results;
}

/**
 * Finds all component instances within a node tree
 * @param node - The starting node
 * @returns Array of component instances
 */
export function findComponentInstances(node: SceneNode): InstanceNode[] {
  return findNodesByType<InstanceNode>(node, 'INSTANCE');
}

/**
 * Finds all components within a node tree
 * @param node - The starting node
 * @returns Array of components
 */
export function findComponents(node: SceneNode): ComponentNode[] {
  return findNodesByType<ComponentNode>(node, 'COMPONENT');
}

/**
 * Finds all component sets within a node tree
 * @param node - The starting node
 * @returns Array of component sets
 */
export function findComponentSets(node: SceneNode): ComponentSetNode[] {
  return findNodesByType<ComponentSetNode>(node, 'COMPONENT_SET');
}

/**
 * Checks if a node is a local component (not from external library)
 * @param node - The node to check
 * @returns True if the component is local
 */
export function isLocalComponent(node: ComponentNode | ComponentSetNode): boolean {
  // In Figma, components from external libraries have a different file key
  // Local components have the same key as the current document
  return node.key.startsWith(figma.root.id);
}

/**
 * Gets the main component from an instance
 * @param instance - The instance node
 * @returns The main component or null if not found
 */
export function getMainComponent(
  instance: InstanceNode
): ComponentNode | ComponentSetNode | null {
  return instance.mainComponent;
}

/**
 * Breadth-first traversal of node tree
 * Useful for predictable iteration order
 * @param node - The starting node
 * @param callback - Function to call for each node
 */
export function traverseBreadthFirst(node: SceneNode, callback: (node: SceneNode) => void): void {
  const queue: SceneNode[] = [node];

  while (queue.length > 0) {
    const current = queue.shift()!;
    callback(current);

    if ('children' in current) {
      queue.push(...current.children);
    }
  }
}

/**
 * Calculates the depth level of a node in the tree
 * @param node - The node to check
 * @returns The depth level (0 for root)
 */
export function getNodeDepth(node: SceneNode): number {
  let depth = 0;
  let current: BaseNode | null = node.parent;

  while (current && current.type !== 'DOCUMENT') {
    depth++;
    current = current.parent;
  }

  return depth;
}

/**
 * Checks if a node has any children
 * @param node - The node to check
 * @returns True if the node has children
 */
export function hasChildren(node: SceneNode): node is SceneNode & ChildrenMixin {
  return 'children' in node && node.children.length > 0;
}

/**
 * Gets all parent nodes up to the page level
 * @param node - The starting node
 * @returns Array of parent nodes
 */
export function getParentChain(node: SceneNode): BaseNode[] {
  const parents: BaseNode[] = [];
  let current: BaseNode | null = node.parent;

  while (current && current.type !== 'DOCUMENT') {
    parents.push(current);
    current = current.parent;
  }

  return parents;
}
