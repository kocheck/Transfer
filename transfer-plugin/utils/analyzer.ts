/**
 * Component dependency analysis utilities
 */

import type {
  ComponentInfo,
  DependencyNode,
  AnalysisResult,
  AnalysisStats,
  Warning,
  FilterOptions,
} from '../types';
import {
  traverseNode,
  findComponentInstances,
  getMainComponent,
  getNodeDepth,
} from './traversal';
import {
  isLocalComponent,
  validateComponent,
  validateMainComponent,
  validateSelection,
} from './validator';

/**
 * Analyzes selection to find all component dependencies
 * @param selection - The current selection
 * @param options - Filter options
 * @returns Analysis result with component tree and warnings
 */
export function analyzeSelection(
  selection: readonly SceneNode[],
  options: FilterOptions = { includeHidden: false, includeExternal: false }
): AnalysisResult {
  const warnings: Warning[] = [];

  // Validate selection
  warnings.push(...validateSelection(selection));
  if (selection.length === 0) {
    return createEmptyResult(warnings);
  }

  // Component map to store unique components
  const componentMap = new Map<string, ComponentInfo>();
  const processedInstances = new Set<string>();

  // Process each selected node
  for (const node of selection) {
    processNode(node, componentMap, processedInstances, options, warnings);
  }

  // Build dependency tree
  const dependencyTree = buildDependencyTree(componentMap);

  // Calculate stats
  const stats = calculateStats(componentMap, warnings);

  return {
    components: componentMap,
    dependencyTree,
    warnings,
    stats,
  };
}

/**
 * Processes a single node and its children
 */
function processNode(
  node: SceneNode,
  componentMap: Map<string, ComponentInfo>,
  processedInstances: Set<string>,
  options: FilterOptions,
  warnings: Warning[]
): void {
  // Handle different node types
  if (node.type === 'COMPONENT') {
    processComponent(node, componentMap, options, warnings);
  } else if (node.type === 'COMPONENT_SET') {
    processComponentSet(node, componentMap, options, warnings);
  } else if (node.type === 'INSTANCE') {
    processInstance(node, componentMap, processedInstances, options, warnings);
  } else if ('children' in node) {
    // Recursively process children of frames/groups
    traverseNode(node, (child) => {
      if (child.type === 'INSTANCE' && !processedInstances.has(child.id)) {
        processInstance(child as InstanceNode, componentMap, processedInstances, options, warnings);
      }
    });
  }
}

/**
 * Processes a component node
 */
function processComponent(
  component: ComponentNode,
  componentMap: Map<string, ComponentInfo>,
  options: FilterOptions,
  warnings: Warning[]
): void {
  // Skip if already processed
  if (componentMap.has(component.id)) {
    return;
  }

  // Check if component is local
  const local = isLocalComponent(component);

  // Skip external components if not included
  if (!local && !options.includeExternal) {
    return;
  }

  // Skip hidden components if not included
  if (!component.visible && !options.includeHidden) {
    return;
  }

  // Validate component
  warnings.push(...validateComponent(component));

  // Create component info
  const info: ComponentInfo = {
    id: component.id,
    name: component.name,
    description: component.description || '',
    type: 'COMPONENT',
    isLocal: local,
    isHidden: !component.visible,
    isLocked: component.locked,
    children: [],
    level: getNodeDepth(component),
  };

  componentMap.set(component.id, info);

  // Find nested component instances
  const nestedInstances = findComponentInstances(component);
  for (const instance of nestedInstances) {
    const mainComp = getMainComponent(instance);
    if (mainComp) {
      info.children.push(mainComp.id);
      // Recursively process nested components
      if (mainComp.type === 'COMPONENT') {
        processComponent(mainComp, componentMap, options, warnings);
      } else if (mainComp.type === 'COMPONENT_SET') {
        processComponentSet(mainComp, componentMap, options, warnings);
      }
    }
  }
}

/**
 * Processes a component set (variants)
 */
function processComponentSet(
  componentSet: ComponentSetNode,
  componentMap: Map<string, ComponentInfo>,
  options: FilterOptions,
  warnings: Warning[]
): void {
  // Skip if already processed
  if (componentMap.has(componentSet.id)) {
    return;
  }

  // Check if component set is local
  const local = isLocalComponent(componentSet);

  // Skip external component sets if not included
  if (!local && !options.includeExternal) {
    return;
  }

  // Skip hidden component sets if not included
  if (!componentSet.visible && !options.includeHidden) {
    return;
  }

  // Validate component set
  warnings.push(...validateComponent(componentSet));

  // Get variant properties
  const variantProperties: Record<string, string> = {};
  if ('componentPropertyDefinitions' in componentSet) {
    const props = componentSet.componentPropertyDefinitions;
    for (const [key, value] of Object.entries(props)) {
      if (value.type === 'VARIANT') {
        variantProperties[key] = value.defaultValue as string;
      }
    }
  }

  // Create component info
  const info: ComponentInfo = {
    id: componentSet.id,
    name: componentSet.name,
    description: componentSet.description || '',
    type: 'COMPONENT_SET',
    isLocal: local,
    isHidden: !componentSet.visible,
    isLocked: componentSet.locked,
    variantCount: componentSet.children.length,
    variantProperties,
    children: [],
    level: getNodeDepth(componentSet),
  };

  componentMap.set(componentSet.id, info);

  // Process nested instances in all variants
  for (const variant of componentSet.children) {
    if (variant.type === 'COMPONENT') {
      const nestedInstances = findComponentInstances(variant);
      for (const instance of nestedInstances) {
        const mainComp = getMainComponent(instance);
        if (mainComp && !info.children.includes(mainComp.id)) {
          info.children.push(mainComp.id);
          // Recursively process nested components
          if (mainComp.type === 'COMPONENT') {
            processComponent(mainComp as unknown as ComponentNode, componentMap, options, warnings);
          } else if (mainComp.type === 'COMPONENT_SET') {
            processComponentSet(mainComp as unknown as ComponentSetNode, componentMap, options, warnings);
          }
        }
      }
    }
  }
}

/**
 * Processes an instance node
 */
function processInstance(
  instance: InstanceNode,
  componentMap: Map<string, ComponentInfo>,
  processedInstances: Set<string>,
  options: FilterOptions,
  warnings: Warning[]
): void {
  // Skip if already processed
  if (processedInstances.has(instance.id)) {
    return;
  }

  processedInstances.add(instance.id);

  // Validate main component exists
  const warning = validateMainComponent(instance);
  if (warning) {
    warnings.push(warning);
    return;
  }

  const mainComponent = instance.mainComponent!;

  // Process the main component
  if (mainComponent.type === 'COMPONENT') {
    processComponent(mainComponent as unknown as ComponentNode, componentMap, options, warnings);
  } else if (mainComponent.type === 'COMPONENT_SET') {
    processComponentSet(mainComponent as unknown as ComponentSetNode, componentMap, options, warnings);
  }
}

/**
 * Builds a dependency tree from the component map
 */
function buildDependencyTree(componentMap: Map<string, ComponentInfo>): DependencyNode[] {
  const tree: DependencyNode[] = [];
  const processed = new Set<string>();

  // Find root components (components that are not children of other components)
  const allChildIds = new Set<string>();
  for (const comp of componentMap.values()) {
    comp.children.forEach((childId) => allChildIds.add(childId));
  }

  for (const comp of componentMap.values()) {
    if (!allChildIds.has(comp.id) && !processed.has(comp.id)) {
      const node = buildDependencyNode(comp.id, componentMap, processed);
      if (node) {
        tree.push(node);
      }
    }
  }

  return tree;
}

/**
 * Builds a single dependency node recursively
 */
function buildDependencyNode(
  componentId: string,
  componentMap: Map<string, ComponentInfo>,
  processed: Set<string>
): DependencyNode | null {
  const component = componentMap.get(componentId);
  if (!component) {
    return null;
  }

  processed.add(componentId);

  const dependencies: DependencyNode[] = [];
  for (const childId of component.children) {
    if (!processed.has(childId)) {
      const childNode = buildDependencyNode(childId, componentMap, processed);
      if (childNode) {
        dependencies.push(childNode);
      }
    }
  }

  return {
    component,
    dependencies,
  };
}

/**
 * Calculates statistics from the analysis
 */
function calculateStats(
  componentMap: Map<string, ComponentInfo>,
  _warnings: Warning[]
): AnalysisStats {
  let mainComponents = 0;
  let childComponents = 0;
  let variantSets = 0;
  let externalComponents = 0;
  let hiddenComponents = 0;
  let lockedComponents = 0;

  for (const comp of componentMap.values()) {
    if (comp.type === 'COMPONENT_SET') {
      variantSets++;
    }

    if (comp.children.length === 0) {
      childComponents++;
    } else {
      mainComponents++;
    }

    if (!comp.isLocal) {
      externalComponents++;
    }

    if (comp.isHidden) {
      hiddenComponents++;
    }

    if (comp.isLocked) {
      lockedComponents++;
    }
  }

  return {
    totalComponents: componentMap.size,
    mainComponents,
    childComponents,
    variantSets,
    externalComponents,
    hiddenComponents,
    lockedComponents,
  };
}

/**
 * Creates an empty analysis result
 */
function createEmptyResult(warnings: Warning[]): AnalysisResult {
  return {
    components: new Map(),
    dependencyTree: [],
    warnings,
    stats: {
      totalComponents: 0,
      mainComponents: 0,
      childComponents: 0,
      variantSets: 0,
      externalComponents: 0,
      hiddenComponents: 0,
      lockedComponents: 0,
    },
  };
}

/**
 * Filters components based on search term
 */
export function filterComponents(
  components: Map<string, ComponentInfo>,
  searchTerm: string
): Map<string, ComponentInfo> {
  if (!searchTerm) {
    return components;
  }

  const filtered = new Map<string, ComponentInfo>();
  const lowerSearch = searchTerm.toLowerCase();

  for (const [id, comp] of components.entries()) {
    if (
      comp.name.toLowerCase().includes(lowerSearch) ||
      comp.description.toLowerCase().includes(lowerSearch)
    ) {
      filtered.set(id, comp);
    }
  }

  return filtered;
}
