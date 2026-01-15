/**
 * Main plugin code for the Transfer plugin
 * Handles plugin lifecycle and communication with UI
 */

import type {
  PluginMessage,
  UIMessage,
  AnalysisResult,
  TransferSettings,
  CancellationToken,
  FilterOptions,
} from './types';
import { analyzeSelection } from './utils/analyzer';
import {
  collectAndTransferComponents,
  clearTransferPage,
  navigateToTransferPage,
  selectAllOnTransferPage,
} from './utils/collector';
import {
  loadSettings,
  updateSettings as updateStoredSettings,
  loadHistory,
  clearHistory as clearStoredHistory,
  addHistoryEntry,
  exportHistoryAsJSON,
  exportHistoryAsCSV,
} from './utils/storage';
import { createCancellationToken } from './utils/batcher';
import { generateTransferReport } from './utils/export';

// Plugin state
let currentCancellationToken: CancellationToken | null = null;
let currentAnalysisResult: AnalysisResult | null = null;

/**
 * Plugin initialization
 */
figma.showUI(__html__, {
  width: 480,
  height: 680,
  themeColors: true,
});

/**
 * Message handler for UI messages
 */
figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    switch (msg.type) {
      case 'ANALYZE_SELECTION':
        await handleAnalyzeSelection();
        break;

      case 'TRANSFER_COMPONENTS':
        await handleTransferComponents(msg.componentIds, msg.settings);
        break;

      case 'CANCEL_OPERATION':
        handleCancelOperation();
        break;

      case 'GET_SETTINGS':
        await handleGetSettings();
        break;

      case 'UPDATE_SETTINGS':
        await handleUpdateSettings(msg.settings);
        break;

      case 'GET_HISTORY':
        await handleGetHistory();
        break;

      case 'CLEAR_HISTORY':
        await handleClearHistory();
        break;

      case 'EXPORT_HISTORY':
        await handleExportHistory(msg.format);
        break;

      case 'EXPORT_REPORT':
        await handleExportReport(msg.historyId);
        break;

      case 'GO_TO_TRANSFER_PAGE':
        handleGoToTransferPage();
        break;

      case 'PREPARE_FOR_COPY':
        handlePrepareForCopy();
        break;

      case 'CLEAR_TRANSFER_PAGE':
        handleClearTransferPage();
        break;

      default:
        console.warn('Unknown message type:', msg);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
  }
};

/**
 * Handles selection analysis
 */
async function handleAnalyzeSelection(): Promise<void> {
  try {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      sendUIMessage({
        type: 'ANALYSIS_ERROR',
        error: 'No nodes selected. Please select at least one frame, component, or instance.',
      });
      return;
    }

    // Load settings to get filter options
    const settings = await loadSettings();
    const filterOptions: FilterOptions = {
      includeHidden: settings.includeHidden,
      includeExternal: false, // Never include external components
    };

    // Perform analysis
    const result = analyzeSelection(selection, filterOptions);
    currentAnalysisResult = result;

    // Send result to UI
    sendUIMessage({
      type: 'ANALYSIS_COMPLETE',
      result,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    sendUIMessage({
      type: 'ANALYSIS_ERROR',
      error: error instanceof Error ? error.message : 'Analysis failed',
    });
  }
}

/**
 * Handles component transfer
 */
async function handleTransferComponents(
  componentIds: string[],
  settings: TransferSettings
): Promise<void> {
  const startTime = Date.now();

  try {
    // Create cancellation token
    currentCancellationToken = createCancellationToken();

    // Get components from current analysis
    if (!currentAnalysisResult) {
      throw new Error('No analysis result available. Please analyze selection first.');
    }

    // Filter to only selected components
    const componentsToTransfer = new Map();
    for (const id of componentIds) {
      const comp = currentAnalysisResult.components.get(id);
      if (comp) {
        componentsToTransfer.set(id, comp);
      }
    }

    if (componentsToTransfer.size === 0) {
      throw new Error('No valid components selected for transfer');
    }

    // Perform transfer with progress updates
    const result = await collectAndTransferComponents(
      componentsToTransfer,
      settings,
      (progress) => {
        sendUIMessage({
          type: 'TRANSFER_PROGRESS',
          progress,
        });
      },
      currentCancellationToken
    );

    const duration = Date.now() - startTime;

    // Calculate stats
    const stats = {
      componentsTransferred: componentsToTransfer.size,
      variantSetsTransferred: Array.from(componentsToTransfer.values()).filter(
        (c) => c.type === 'COMPONENT_SET'
      ).length,
      processingTime: duration,
      warnings: result.warnings.length,
    };

    // Add to history
    const historyEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      componentIds: Array.from(componentsToTransfer.keys()),
      componentNames: Array.from(componentsToTransfer.values()).map((c) => c.name),
      stats,
      status: result.warnings.length > 0 ? ('warning' as const) : ('success' as const),
      warnings: result.warnings,
      duration,
    };

    await addHistoryEntry(historyEntry);

    // Send completion message
    sendUIMessage({
      type: 'TRANSFER_COMPLETE',
      stats,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Transfer error:', error);

    if (error instanceof Error && error.message === 'Operation cancelled') {
      sendUIMessage({
        type: 'TRANSFER_ERROR',
        error: 'Transfer cancelled by user',
      });
    } else {
      sendUIMessage({
        type: 'TRANSFER_ERROR',
        error: error instanceof Error ? error.message : 'Transfer failed',
      });
    }
  } finally {
    currentCancellationToken = null;
  }
}

/**
 * Handles operation cancellation
 */
function handleCancelOperation(): void {
  if (currentCancellationToken) {
    currentCancellationToken.cancel();
  }
}

/**
 * Handles getting settings
 */
async function handleGetSettings(): Promise<void> {
  const settings = await loadSettings();
  sendUIMessage({
    type: 'SETTINGS_LOADED',
    settings,
  });
}

/**
 * Handles updating settings
 */
async function handleUpdateSettings(updates: Partial<TransferSettings>): Promise<void> {
  const updated = await updateStoredSettings(updates);
  sendUIMessage({
    type: 'SETTINGS_LOADED',
    settings: updated,
  });
}

/**
 * Handles getting history
 */
async function handleGetHistory(): Promise<void> {
  const history = await loadHistory();
  sendUIMessage({
    type: 'HISTORY_LOADED',
    history,
  });
}

/**
 * Handles clearing history
 */
async function handleClearHistory(): Promise<void> {
  await clearStoredHistory();
  sendUIMessage({
    type: 'HISTORY_LOADED',
    history: [],
  });
}

/**
 * Handles exporting history
 */
async function handleExportHistory(format: 'json' | 'csv'): Promise<void> {
  const data = format === 'json' ? await exportHistoryAsJSON() : await exportHistoryAsCSV();

  const filename = `transfer_history_${new Date().toISOString().split('T')[0]}.${format}`;

  sendUIMessage({
    type: 'EXPORT_DATA',
    data,
    filename,
  });
}

/**
 * Handles exporting a single report
 */
async function handleExportReport(historyId: string): Promise<void> {
  const history = await loadHistory();
  const entry = history.find((h) => h.id === historyId);

  if (!entry) {
    throw new Error('History entry not found');
  }

  const report = generateTransferReport(entry, currentAnalysisResult?.components);
  const filename = `transfer_report_${new Date(entry.timestamp).toISOString().split('T')[0]}.md`;

  sendUIMessage({
    type: 'EXPORT_DATA',
    data: report,
    filename,
  });
}

/**
 * Handles navigation to Transfer page
 */
function handleGoToTransferPage(): void {
  const success = navigateToTransferPage();
  if (!success) {
    figma.notify('Transfer page not found. Please transfer components first.');
  } else {
    figma.notify('Navigated to Transfer page');
  }
}

/**
 * Handles preparing for copy
 */
function handlePrepareForCopy(): void {
  const success = selectAllOnTransferPage();
  if (!success) {
    figma.notify('Transfer page not found or empty. Please transfer components first.');
  } else {
    figma.notify('All components selected. Press Cmd/Ctrl+C to copy.');
  }
}

/**
 * Handles clearing the Transfer page
 */
function handleClearTransferPage(): void {
  const success = clearTransferPage();
  if (!success) {
    figma.notify('Transfer page not found');
  } else {
    figma.notify('Transfer page cleared');
  }
}

/**
 * Sends a message to the UI
 */
function sendUIMessage(message: UIMessage): void {
  figma.ui.postMessage(message);
}

/**
 * Sends an error message to the UI
 */
function sendErrorMessage(error: string): void {
  figma.notify(error, { error: true });
}

/**
 * Handle plugin close
 */
figma.on('close', () => {
  // Cleanup if needed
  if (currentCancellationToken) {
    currentCancellationToken.cancel();
  }
});
