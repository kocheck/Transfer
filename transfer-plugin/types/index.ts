/**
 * Type definitions for the Transfer plugin
 */

// Component metadata
export interface ComponentInfo {
  id: string;
  name: string;
  description: string;
  type: 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE';
  isLocal: boolean;
  isHidden: boolean;
  isLocked: boolean;
  variantCount?: number;
  variantProperties?: Record<string, string>;
  children: string[]; // IDs of child components
  parent?: string; // ID of parent component
  level: number; // Depth in hierarchy
}

// Dependency tree structure
export interface DependencyNode {
  component: ComponentInfo;
  dependencies: DependencyNode[];
}

// Analysis results
export interface AnalysisResult {
  components: Map<string, ComponentInfo>;
  dependencyTree: DependencyNode[];
  warnings: Warning[];
  stats: AnalysisStats;
}

export interface AnalysisStats {
  totalComponents: number;
  mainComponents: number;
  childComponents: number;
  variantSets: number;
  externalComponents: number;
  hiddenComponents: number;
  lockedComponents: number;
}

// Warning types
export interface Warning {
  type: 'EXTERNAL_DEPENDENCY' | 'LOCKED_COMPONENT' | 'MISSING_DEFINITION' | 'HIDDEN_COMPONENT';
  message: string;
  componentId?: string;
  componentName?: string;
}

// Transfer settings
export interface TransferSettings {
  // Layout preferences
  spacing: number;
  groupingMethod: 'hierarchy' | 'selection' | 'type' | 'flat';
  layoutType: 'grid' | 'list';
  gridColumns: number;

  // Transfer options
  autoNavigate: boolean;
  autoSelect: boolean;
  includeAnnotations: boolean;
  includeDescriptions: boolean;
  includeHidden: boolean;

  // Transfer page behavior
  transferPageBehavior: 'ask' | 'append' | 'replace' | 'timestamp';

  // Performance settings
  batchSize: number;
  enableCache: boolean;
  virtualScrollThreshold: number;

  // Keyboard shortcuts
  shortcuts: KeyboardShortcuts;
}

export interface KeyboardShortcuts {
  analyze: string;
  execute: string;
  goToTransferPage: string;
  prepareForCopy: string;
  cancel: string;
  undo: string;
}

// Default settings
export const DEFAULT_SETTINGS: TransferSettings = {
  spacing: 200,
  groupingMethod: 'hierarchy',
  layoutType: 'grid',
  gridColumns: 4,
  autoNavigate: true,
  autoSelect: true,
  includeAnnotations: true,
  includeDescriptions: true,
  includeHidden: false,
  transferPageBehavior: 'ask',
  batchSize: 10,
  enableCache: true,
  virtualScrollThreshold: 100,
  shortcuts: {
    analyze: 'Ctrl+T',
    execute: 'Ctrl+Enter',
    goToTransferPage: 'Ctrl+G',
    prepareForCopy: 'Ctrl+C',
    cancel: 'Escape',
    undo: 'Ctrl+Z',
  },
};

// Transfer history entry
export interface HistoryEntry {
  id: string;
  timestamp: number;
  componentIds: string[];
  componentNames: string[];
  stats: TransferStats;
  status: 'success' | 'warning' | 'error';
  warnings: Warning[];
  duration: number;
}

export interface TransferStats {
  componentsTransferred: number;
  variantSetsTransferred: number;
  processingTime: number;
  warnings: number;
}

// Progress tracking
export interface ProgressInfo {
  phase: 'analyzing' | 'collecting' | 'organizing' | 'finalizing';
  percentage: number;
  currentItem: string;
  processed: number;
  total: number;
  estimatedTimeRemaining: number;
}

// Message types for plugin-UI communication
export type PluginMessage =
  | { type: 'ANALYZE_SELECTION' }
  | { type: 'TRANSFER_COMPONENTS'; componentIds: string[]; settings: TransferSettings }
  | { type: 'CANCEL_OPERATION' }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<TransferSettings> }
  | { type: 'GET_HISTORY' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'EXPORT_HISTORY'; format: 'json' | 'csv' }
  | { type: 'EXPORT_REPORT'; historyId: string }
  | { type: 'GO_TO_TRANSFER_PAGE' }
  | { type: 'PREPARE_FOR_COPY' }
  | { type: 'CLEAR_TRANSFER_PAGE' };

export type UIMessage =
  | { type: 'ANALYSIS_COMPLETE'; result: AnalysisResult }
  | { type: 'ANALYSIS_ERROR'; error: string }
  | { type: 'TRANSFER_PROGRESS'; progress: ProgressInfo }
  | { type: 'TRANSFER_COMPLETE'; stats: TransferStats; warnings: Warning[] }
  | { type: 'TRANSFER_ERROR'; error: string }
  | { type: 'SETTINGS_LOADED'; settings: TransferSettings }
  | { type: 'HISTORY_LOADED'; history: HistoryEntry[] }
  | { type: 'EXPORT_DATA'; data: string; filename: string };

// Cancellation token
export interface CancellationToken {
  isCancelled: boolean;
  cancel(): void;
}

// Layout calculation result
export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  groups: LayoutGroup[];
  totalWidth: number;
  totalHeight: number;
}

export interface LayoutGroup {
  name: string;
  componentIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

// Component filter options
export interface FilterOptions {
  includeHidden: boolean;
  includeExternal: boolean;
  searchTerm?: string;
  componentType?: 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE';
}
