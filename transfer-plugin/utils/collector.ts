/**
 * Component collection and transfer utilities
 */

import type { ComponentInfo, TransferSettings, Warning, CancellationToken } from '../types';
import { ProgressTracker } from './progress';
import { processBatch } from './batcher';

/**
 * Collects and transfers components to the Transfer page
 * @param components - Map of components to transfer
 * @param settings - Transfer settings
 * @param progressCallback - Progress update callback
 * @param cancellationToken - Cancellation token
 * @returns Array of transferred node IDs
 */
export async function collectAndTransferComponents(
  components: Map<string, ComponentInfo>,
  settings: TransferSettings,
  progressCallback?: (progress: any) => void,
  cancellationToken?: CancellationToken
): Promise<{ nodeIds: string[]; warnings: Warning[] }> {
  const warnings: Warning[] = [];
  const tracker = new ProgressTracker(progressCallback);

  try {
    // Phase 1: Find or create Transfer page
    tracker.start(components.size, 'collecting');
    const transferPage = await findOrCreateTransferPage(settings, warnings);

    if (!transferPage) {
      throw new Error('Failed to create Transfer page');
    }

    // Phase 2: Collect components
    tracker.setPhase('collecting');
    const collectedNodes: SceneNode[] = [];

    const componentArray = Array.from(components.values());
    await processBatch(
      componentArray,
      settings.batchSize,
      async (compInfo, _index) => {
        if (cancellationToken?.isCancelled) {
          throw new Error('Operation cancelled');
        }

        try {
          const node = figma.getNodeById(compInfo.id) as
            | ComponentNode
            | ComponentSetNode
            | null;

          if (!node) {
            warnings.push({
              type: 'MISSING_DEFINITION',
              message: `Component "${compInfo.name}" not found`,
              componentId: compInfo.id,
              componentName: compInfo.name,
            });
            return;
          }

          // Skip locked components
          if (node.locked) {
            warnings.push({
              type: 'LOCKED_COMPONENT',
              message: `Component "${compInfo.name}" is locked and was skipped`,
              componentId: compInfo.id,
              componentName: compInfo.name,
            });
            return;
          }

          // Clone the component
          const clone = node.clone();
          transferPage.appendChild(clone);
          collectedNodes.push(clone);

          tracker.increment(compInfo.name);
        } catch (error) {
          warnings.push({
            type: 'MISSING_DEFINITION',
            message: `Failed to collect component "${compInfo.name}": ${error}`,
            componentId: compInfo.id,
            componentName: compInfo.name,
          });
        }
      },
      (processed, _total) => tracker.updateProgress(processed),
      cancellationToken
    );

    // Phase 3: Organize layout
    tracker.setPhase('organizing');
    await organizeComponentsOnPage(collectedNodes, settings, transferPage);

    // Phase 4: Finalize
    tracker.setPhase('finalizing');

    if (settings.autoNavigate) {
      figma.currentPage = transferPage;
    }

    if (settings.autoSelect && collectedNodes.length > 0) {
      figma.currentPage.selection = collectedNodes;
      figma.viewport.scrollAndZoomIntoView(collectedNodes);
    }

    tracker.complete();

    return {
      nodeIds: collectedNodes.map((n) => n.id),
      warnings,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Operation cancelled') {
      throw error;
    }
    throw new Error(`Transfer failed: ${error}`);
  }
}

/**
 * Finds or creates the Transfer page
 */
async function findOrCreateTransferPage(
  settings: TransferSettings,
  _warnings: Warning[]
): Promise<PageNode | null> {
  const existingPage = figma.root.children.find((page) => page.name === 'Transfer') as
    | PageNode
    | undefined;

  if (existingPage) {
    // Handle based on settings
    if (settings.transferPageBehavior === 'replace') {
      // Clear the page
      existingPage.children.forEach((child) => child.remove());
      return existingPage;
    } else if (settings.transferPageBehavior === 'append') {
      // Keep existing content
      return existingPage;
    } else if (settings.transferPageBehavior === 'timestamp') {
      // Create new page with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const newPage = figma.createPage();
      newPage.name = `Transfer ${timestamp}`;
      return newPage;
    }
    // 'ask' should be handled by UI before calling this function
  }

  // Create new page
  const newPage = figma.createPage();
  newPage.name = 'Transfer';
  return newPage;
}

/**
 * Organizes components on the transfer page
 */
async function organizeComponentsOnPage(
  nodes: SceneNode[],
  settings: TransferSettings,
  _page: PageNode
): Promise<void> {
  if (nodes.length === 0) return;

  const spacing = settings.spacing;

  if (settings.layoutType === 'grid') {
    // Grid layout
    const columns = settings.gridColumns;
    let x = 0;
    let y = 0;
    let maxHeightInRow = 0;
    let col = 0;

    for (const node of nodes) {
      node.x = x;
      node.y = y;

      const width = 'width' in node ? node.width : 0;
      const height = 'height' in node ? node.height : 0;

      maxHeightInRow = Math.max(maxHeightInRow, height);

      col++;
      if (col >= columns) {
        // Move to next row
        col = 0;
        x = 0;
        y += maxHeightInRow + spacing;
        maxHeightInRow = 0;
      } else {
        // Move to next column
        x += width + spacing;
      }
    }
  } else {
    // List layout (vertical)
    let y = 0;

    for (const node of nodes) {
      node.x = 0;
      node.y = y;

      const height = 'height' in node ? node.height : 0;
      y += height + spacing;
    }
  }

  // Add annotations if enabled
  if (settings.includeAnnotations) {
    addAnnotations(nodes, settings);
  }
}

/**
 * Adds annotations/labels to components
 */
function addAnnotations(nodes: SceneNode[], settings: TransferSettings): void {
  for (const node of nodes) {
    if (settings.includeDescriptions) {
      const description =
        'description' in node && node.description ? node.description : node.name;

      // Create a text node for the annotation
      const text = figma.createText();
      text.characters = description;
      text.fontSize = 12;
      text.x = node.x;
      text.y = node.y - 20; // Place above the component

      // Add to the same parent
      if (node.parent) {
        node.parent.appendChild(text);
      }
    }
  }
}

/**
 * Clears the Transfer page
 */
export function clearTransferPage(): boolean {
  const transferPage = figma.root.children.find((page) => page.name === 'Transfer') as
    | PageNode
    | undefined;

  if (transferPage) {
    transferPage.children.forEach((child) => child.remove());
    return true;
  }

  return false;
}

/**
 * Navigates to the Transfer page
 */
export function navigateToTransferPage(): boolean {
  const transferPage = figma.root.children.find((page) => page.name === 'Transfer') as
    | PageNode
    | undefined;

  if (transferPage) {
    figma.currentPage = transferPage;
    return true;
  }

  return false;
}

/**
 * Selects all components on the Transfer page
 */
export function selectAllOnTransferPage(): boolean {
  const transferPage = figma.root.children.find((page) => page.name === 'Transfer') as
    | PageNode
    | undefined;

  if (transferPage && transferPage.children.length > 0) {
    figma.currentPage = transferPage;
    figma.currentPage.selection = transferPage.children as SceneNode[];
    figma.viewport.scrollAndZoomIntoView(transferPage.children as SceneNode[]);
    return true;
  }

  return false;
}
