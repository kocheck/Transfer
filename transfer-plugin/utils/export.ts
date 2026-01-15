/**
 * Export and report generation utilities
 */

import type { HistoryEntry, ComponentInfo, AnalysisResult, TransferStats } from '../types';

/**
 * Generates a transfer report in markdown format
 * @param historyEntry - The history entry to generate a report for
 * @param components - Map of component information
 * @returns Markdown formatted report
 */
export function generateTransferReport(
  historyEntry: HistoryEntry,
  components?: Map<string, ComponentInfo>
): string {
  const date = new Date(historyEntry.timestamp).toLocaleString();

  let report = `# Transfer Report\n\n`;
  report += `**Date:** ${date}\n`;
  report += `**Status:** ${historyEntry.status.toUpperCase()}\n`;
  report += `**Duration:** ${formatDuration(historyEntry.duration)}\n\n`;

  report += `## Statistics\n\n`;
  report += `- Components Transferred: ${historyEntry.stats.componentsTransferred}\n`;
  report += `- Variant Sets Transferred: ${historyEntry.stats.variantSetsTransferred}\n`;
  report += `- Warnings: ${historyEntry.warnings.length}\n\n`;

  if (historyEntry.warnings.length > 0) {
    report += `## Warnings\n\n`;
    for (const warning of historyEntry.warnings) {
      report += `- **${warning.type}**: ${warning.message}\n`;
    }
    report += `\n`;
  }

  report += `## Components\n\n`;
  for (const name of historyEntry.componentNames) {
    report += `- ${name}\n`;
  }

  if (components) {
    report += `\n## Component Details\n\n`;
    for (const [id, comp] of components.entries()) {
      if (historyEntry.componentIds.includes(id)) {
        report += `### ${comp.name}\n\n`;
        if (comp.description) {
          report += `${comp.description}\n\n`;
        }
        report += `- **Type:** ${comp.type}\n`;
        report += `- **Local:** ${comp.isLocal ? 'Yes' : 'No'}\n`;
        if (comp.variantCount) {
          report += `- **Variants:** ${comp.variantCount}\n`;
        }
        if (comp.children.length > 0) {
          report += `- **Dependencies:** ${comp.children.length}\n`;
        }
        report += `\n`;
      }
    }
  }

  return report;
}

/**
 * Generates a summary report from analysis results
 * @param result - Analysis result
 * @returns Text formatted summary
 */
export function generateAnalysisSummary(result: AnalysisResult): string {
  let summary = `Analysis Summary\n`;
  summary += `================\n\n`;

  summary += `Total Components: ${result.stats.totalComponents}\n`;
  summary += `Main Components: ${result.stats.mainComponents}\n`;
  summary += `Child Components: ${result.stats.childComponents}\n`;
  summary += `Variant Sets: ${result.stats.variantSets}\n`;
  summary += `External Components: ${result.stats.externalComponents}\n`;
  summary += `Hidden Components: ${result.stats.hiddenComponents}\n`;
  summary += `Locked Components: ${result.stats.lockedComponents}\n\n`;

  if (result.warnings.length > 0) {
    summary += `Warnings (${result.warnings.length}):\n`;
    for (const warning of result.warnings) {
      summary += `  - ${warning.message}\n`;
    }
    summary += `\n`;
  }

  summary += `Dependency Tree:\n`;
  summary += generateDependencyTreeText(result.dependencyTree, 0);

  return summary;
}

/**
 * Generates ASCII art dependency tree
 */
function generateDependencyTreeText(nodes: any[], indent: number): string {
  let tree = '';
  const prefix = '  '.repeat(indent);

  for (const node of nodes) {
    tree += `${prefix}├─ ${node.component.name}`;
    if (node.component.type === 'COMPONENT_SET') {
      tree += ` (${node.component.variantCount} variants)`;
    }
    tree += `\n`;

    if (node.dependencies && node.dependencies.length > 0) {
      tree += generateDependencyTreeText(node.dependencies, indent + 1);
    }
  }

  return tree;
}

/**
 * Exports component list as CSV
 * @param components - Map of components
 * @returns CSV string
 */
export function exportComponentsAsCSV(components: Map<string, ComponentInfo>): string {
  const headers = [
    'ID',
    'Name',
    'Type',
    'Description',
    'Is Local',
    'Is Hidden',
    'Is Locked',
    'Variant Count',
    'Dependencies',
  ];

  const rows: string[][] = [];

  for (const comp of components.values()) {
    rows.push([
      comp.id,
      comp.name,
      comp.type,
      comp.description || '',
      comp.isLocal ? 'Yes' : 'No',
      comp.isHidden ? 'Yes' : 'No',
      comp.isLocked ? 'Yes' : 'No',
      comp.variantCount?.toString() || '0',
      comp.children.length.toString(),
    ]);
  }

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Exports component list as JSON
 * @param components - Map of components
 * @returns JSON string
 */
export function exportComponentsAsJSON(components: Map<string, ComponentInfo>): string {
  const array = Array.from(components.values());
  return JSON.stringify(array, null, 2);
}

/**
 * Generates a copy checklist
 * @param stats - Transfer statistics
 * @param hasExternalDeps - Whether external dependencies exist
 * @returns Checklist text
 */
export function generateCopyChecklist(stats: TransferStats, hasExternalDeps: boolean): string {
  let checklist = `Copy Checklist\n`;
  checklist += `==============\n\n`;

  checklist += `☐ Verify all ${stats.componentsTransferred} components are selected\n`;
  checklist += `☐ Copy components (Cmd/Ctrl + C)\n`;
  checklist += `☐ Open destination file\n`;
  checklist += `☐ Paste components (Cmd/Ctrl + V)\n\n`;

  checklist += `Additional Steps:\n`;
  checklist += `☐ Check if text styles need to be transferred separately\n`;
  checklist += `☐ Check if color styles need to be transferred separately\n`;
  checklist += `☐ Check if effects need to be transferred separately\n`;

  if (hasExternalDeps) {
    checklist += `☐ ⚠️ Ensure external library dependencies are available in destination file\n`;
  }

  checklist += `\n☐ Verify all component properties are intact\n`;
  checklist += `☐ Test component instances work correctly\n`;

  return checklist;
}

/**
 * Formats duration in milliseconds to readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Creates a filename with timestamp
 * @param baseName - Base filename
 * @param extension - File extension
 * @returns Filename with timestamp
 */
export function createTimestampedFilename(baseName: string, extension: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${baseName}_${timestamp}.${extension}`;
}
