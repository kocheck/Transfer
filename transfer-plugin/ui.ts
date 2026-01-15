/**
 * UI logic for the Transfer plugin
 * Handles user interactions and communication with plugin code
 */

import type {
  PluginMessage,
  UIMessage,
  AnalysisResult,
  TransferSettings,
  HistoryEntry,
  ComponentInfo,
  ProgressInfo,
} from './types';

// UI State
let currentAnalysis: AnalysisResult | null = null;
let currentSettings: TransferSettings | null = null;
let selectedComponentIds = new Set<string>();

/**
 * Initialize UI
 */
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupEventListeners();
  setupKeyboardShortcuts();
  loadSettings();
  loadHistory();
});

/**
 * Setup tab navigation
 */
function setupTabs(): void {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');

      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Show corresponding content
      tabContents.forEach((content) => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // Transfer tab
  getElement('analyze-btn').addEventListener('click', handleAnalyze);
  getElement('transfer-btn').addEventListener('click', handleTransfer);
  getElement('select-all-btn').addEventListener('click', handleSelectAll);
  getElement('deselect-all-btn').addEventListener('click', handleDeselectAll);
  getElement('cancel-btn').addEventListener('click', handleCancel);
  getElement('go-to-page-btn').addEventListener('click', handleGoToPage);
  getElement('prepare-copy-btn').addEventListener('click', handlePrepareCopy);
  getElement('new-transfer-btn').addEventListener('click', handleNewTransfer);

  // Settings tab
  setupSettingsListeners();

  // History tab
  getElement('export-history-btn').addEventListener('click', handleExportHistory);
  getElement('clear-history-btn').addEventListener('click', handleClearHistory);
}

/**
 * Setup settings event listeners
 */
function setupSettingsListeners(): void {
  const settingIds = [
    'setting-spacing',
    'setting-layout-type',
    'setting-grid-columns',
    'setting-auto-navigate',
    'setting-auto-select',
    'setting-include-annotations',
    'setting-include-descriptions',
    'setting-include-hidden',
    'setting-page-behavior',
  ];

  settingIds.forEach((id) => {
    const element = getElement(id);
    element.addEventListener('change', handleSettingsChange);
  });
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + T - Analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      handleAnalyze();
    }

    // Ctrl/Cmd + Enter - Transfer
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleTransfer();
    }

    // Ctrl/Cmd + G - Go to Transfer page
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      handleGoToPage();
    }

    // Escape - Cancel
    if (e.key === 'Escape') {
      handleCancel();
    }
  });
}

/**
 * Handle analyze button click
 */
function handleAnalyze(): void {
  showEmptyState(false);
  showResults(false);
  showCompletion(false);
  postMessage({ type: 'ANALYZE_SELECTION' });
}

/**
 * Handle transfer button click
 */
function handleTransfer(): void {
  if (!currentSettings || selectedComponentIds.size === 0) {
    return;
  }

  showResults(false);
  showProgress(true);

  postMessage({
    type: 'TRANSFER_COMPONENTS',
    componentIds: Array.from(selectedComponentIds),
    settings: currentSettings,
  });
}

/**
 * Handle select all button click
 */
function handleSelectAll(): void {
  if (!currentAnalysis) return;

  selectedComponentIds.clear();
  currentAnalysis.components.forEach((_, id) => {
    selectedComponentIds.add(id);
  });

  updateComponentCheckboxes();
  updateTransferButton();
}

/**
 * Handle deselect all button click
 */
function handleDeselectAll(): void {
  selectedComponentIds.clear();
  updateComponentCheckboxes();
  updateTransferButton();
}

/**
 * Handle cancel button click
 */
function handleCancel(): void {
  postMessage({ type: 'CANCEL_OPERATION' });
  showProgress(false);
  showResults(true);
}

/**
 * Handle go to page button click
 */
function handleGoToPage(): void {
  postMessage({ type: 'GO_TO_TRANSFER_PAGE' });
}

/**
 * Handle prepare for copy button click
 */
function handlePrepareCopy(): void {
  postMessage({ type: 'PREPARE_FOR_COPY' });
}

/**
 * Handle new transfer button click
 */
function handleNewTransfer(): void {
  showCompletion(false);
  showEmptyState(true);
  currentAnalysis = null;
  selectedComponentIds.clear();
}

/**
 * Handle settings change
 */
function handleSettingsChange(): void {
  if (!currentSettings) return;

  // Update settings object
  currentSettings.spacing = parseInt(getInputValue('setting-spacing'));
  currentSettings.layoutType = getInputValue('setting-layout-type') as 'grid' | 'list';
  currentSettings.gridColumns = parseInt(getInputValue('setting-grid-columns'));
  currentSettings.autoNavigate = getCheckboxValue('setting-auto-navigate');
  currentSettings.autoSelect = getCheckboxValue('setting-auto-select');
  currentSettings.includeAnnotations = getCheckboxValue('setting-include-annotations');
  currentSettings.includeDescriptions = getCheckboxValue('setting-include-descriptions');
  currentSettings.includeHidden = getCheckboxValue('setting-include-hidden');
  currentSettings.transferPageBehavior = getInputValue('setting-page-behavior') as any;

  // Save settings
  postMessage({
    type: 'UPDATE_SETTINGS',
    settings: currentSettings,
  });
}

/**
 * Handle export history button click
 */
function handleExportHistory(): void {
  postMessage({
    type: 'EXPORT_HISTORY',
    format: 'json',
  });
}

/**
 * Handle clear history button click
 */
function handleClearHistory(): void {
  if (confirm('Are you sure you want to clear all transfer history?')) {
    postMessage({ type: 'CLEAR_HISTORY' });
  }
}

/**
 * Load settings from plugin
 */
function loadSettings(): void {
  postMessage({ type: 'GET_SETTINGS' });
}

/**
 * Load history from plugin
 */
function loadHistory(): void {
  postMessage({ type: 'GET_HISTORY' });
}

/**
 * Handle messages from plugin
 */
window.onmessage = (event: MessageEvent<UIMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'ANALYSIS_COMPLETE':
      handleAnalysisComplete(msg.result);
      break;

    case 'ANALYSIS_ERROR':
      handleError(msg.error);
      break;

    case 'TRANSFER_PROGRESS':
      handleTransferProgress(msg.progress);
      break;

    case 'TRANSFER_COMPLETE':
      handleTransferComplete(msg.stats, msg.warnings);
      break;

    case 'TRANSFER_ERROR':
      handleTransferError(msg.error);
      break;

    case 'SETTINGS_LOADED':
      handleSettingsLoaded(msg.settings);
      break;

    case 'HISTORY_LOADED':
      handleHistoryLoaded(msg.history);
      break;

    case 'EXPORT_DATA':
      handleExportData(msg.data, msg.filename);
      break;
  }
};

/**
 * Handle analysis complete
 */
function handleAnalysisComplete(result: AnalysisResult): void {
  currentAnalysis = result;
  selectedComponentIds.clear();

  // Auto-select all valid components
  result.components.forEach((comp, id) => {
    if (comp.isLocal && !comp.isLocked) {
      selectedComponentIds.add(id);
    }
  });

  displayAnalysisResults(result);
  showEmptyState(false);
  showResults(true);
}

/**
 * Handle transfer progress update
 */
function handleTransferProgress(progress: ProgressInfo): void {
  updateProgressBar(progress.percentage);
  updateProgressText(progress);
}

/**
 * Handle transfer complete
 */
function handleTransferComplete(stats: any, warnings: any[]): void {
  showProgress(false);
  showCompletion(true);
  displayCompletionStats(stats, warnings);
}

/**
 * Handle transfer error
 */
function handleTransferError(error: string): void {
  showProgress(false);
  showResults(true);
  alert(`Transfer failed: ${error}`);
}

/**
 * Handle error
 */
function handleError(error: string): void {
  showEmptyState(true);
  alert(error);
}

/**
 * Handle settings loaded
 */
function handleSettingsLoaded(settings: TransferSettings): void {
  currentSettings = settings;
  updateSettingsUI(settings);
}

/**
 * Handle history loaded
 */
function handleHistoryLoaded(history: HistoryEntry[]): void {
  displayHistory(history);
}

/**
 * Handle export data
 */
function handleExportData(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Display analysis results
 */
function displayAnalysisResults(result: AnalysisResult): void {
  // Display stats
  const statsHtml = `
    <h3>Analysis Results</h3>
    <div class="selection-stat">
      <span>Total Components:</span>
      <span>${result.stats.totalComponents}</span>
    </div>
    <div class="selection-stat">
      <span>Variant Sets:</span>
      <span>${result.stats.variantSets}</span>
    </div>
    <div class="selection-stat">
      <span>External Components:</span>
      <span>${result.stats.externalComponents}</span>
    </div>
  `;
  getElement('stats-summary').innerHTML = statsHtml;

  // Display warnings
  if (result.warnings.length > 0) {
    const warningsHtml = result.warnings
      .map(
        (w) => `
      <div class="warning-item">
        <strong>${w.type}:</strong> ${w.message}
      </div>
    `
      )
      .join('');
    getElement('warnings-container').innerHTML = warningsHtml;
    getElement('warnings-container').classList.remove('hidden');
  }

  // Display component list
  displayComponentList(result.components);
}

/**
 * Display component list
 */
function displayComponentList(components: Map<string, ComponentInfo>): void {
  const listHtml = Array.from(components.values())
    .map(
      (comp) => `
    <div class="component-card">
      <input
        type="checkbox"
        ${selectedComponentIds.has(comp.id) ? 'checked' : ''}
        ${!comp.isLocal || comp.isLocked ? 'disabled' : ''}
        data-component-id="${comp.id}"
      />
      <div class="component-info">
        <div class="component-name">${comp.name}</div>
        ${comp.description ? `<div class="component-description">${comp.description}</div>` : ''}
        <div class="component-meta">
          <span>${comp.type}</span>
          ${comp.variantCount ? `<span>${comp.variantCount} variants</span>` : ''}
          ${comp.children.length > 0 ? `<span>${comp.children.length} dependencies</span>` : ''}
        </div>
        ${!comp.isLocal ? '<span class="badge badge-warning">External</span>' : ''}
        ${comp.isLocked ? '<span class="badge badge-error">Locked</span>' : ''}
        ${comp.isHidden ? '<span class="badge badge-warning">Hidden</span>' : ''}
      </div>
    </div>
  `
    )
    .join('');

  getElement('component-list').innerHTML = listHtml;

  // Add checkbox listeners
  document.querySelectorAll('.component-card input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const componentId = target.getAttribute('data-component-id')!;

      if (target.checked) {
        selectedComponentIds.add(componentId);
      } else {
        selectedComponentIds.delete(componentId);
      }

      updateTransferButton();
    });
  });

  updateTransferButton();
}

/**
 * Update component checkboxes
 */
function updateComponentCheckboxes(): void {
  document.querySelectorAll('.component-card input[type="checkbox"]').forEach((checkbox) => {
    const target = checkbox as HTMLInputElement;
    const componentId = target.getAttribute('data-component-id')!;
    target.checked = selectedComponentIds.has(componentId);
  });
}

/**
 * Update transfer button state
 */
function updateTransferButton(): void {
  const btn = getElement('transfer-btn') as HTMLButtonElement;
  btn.disabled = selectedComponentIds.size === 0;
}

/**
 * Update progress bar
 */
function updateProgressBar(percentage: number): void {
  getElement('progress-fill').style.width = `${percentage}%`;
  getElement('progress-text').textContent = `${percentage}%`;
}

/**
 * Update progress text
 */
function updateProgressText(progress: ProgressInfo): void {
  const phaseText = {
    analyzing: '🔍 Analyzing dependencies...',
    collecting: '📦 Collecting components...',
    organizing: '📐 Organizing layout...',
    finalizing: '✅ Finalizing...',
  };

  getElement('progress-phase').textContent = phaseText[progress.phase];
  getElement('progress-item').textContent = progress.currentItem
    ? `Current: ${progress.currentItem}`
    : '';
}

/**
 * Display completion stats
 */
function displayCompletionStats(stats: any, warnings: any[]): void {
  const statsHtml = `
    <div class="selection-stat">
      <span>Components Transferred:</span>
      <span>${stats.componentsTransferred}</span>
    </div>
    <div class="selection-stat">
      <span>Variant Sets:</span>
      <span>${stats.variantSetsTransferred}</span>
    </div>
    <div class="selection-stat">
      <span>Processing Time:</span>
      <span>${formatTime(stats.processingTime)}</span>
    </div>
    ${
      warnings.length > 0
        ? `
    <div class="selection-stat">
      <span>Warnings:</span>
      <span>${warnings.length}</span>
    </div>
    `
        : ''
    }
  `;

  getElement('completion-stats').innerHTML = statsHtml;
}

/**
 * Display history
 */
function displayHistory(history: HistoryEntry[]): void {
  if (history.length === 0) {
    getElement('history-empty').classList.remove('hidden');
    getElement('history-list').innerHTML = '';
    return;
  }

  getElement('history-empty').classList.add('hidden');

  const historyHtml = history
    .map(
      (entry) => `
    <div class="history-item">
      <div class="history-header">
        <span class="history-date">${new Date(entry.timestamp).toLocaleString()}</span>
        <span class="badge badge-${entry.status}">${entry.status}</span>
      </div>
      <div class="history-stats">
        ${entry.stats.componentsTransferred} components •
        ${entry.stats.variantSetsTransferred} variant sets •
        ${formatTime(entry.duration)}
        ${entry.warnings.length > 0 ? ` • ${entry.warnings.length} warnings` : ''}
      </div>
    </div>
  `
    )
    .join('');

  getElement('history-list').innerHTML = historyHtml;
}

/**
 * Update settings UI
 */
function updateSettingsUI(settings: TransferSettings): void {
  setInputValue('setting-spacing', settings.spacing.toString());
  setInputValue('setting-layout-type', settings.layoutType);
  setInputValue('setting-grid-columns', settings.gridColumns.toString());
  setCheckboxValue('setting-auto-navigate', settings.autoNavigate);
  setCheckboxValue('setting-auto-select', settings.autoSelect);
  setCheckboxValue('setting-include-annotations', settings.includeAnnotations);
  setCheckboxValue('setting-include-descriptions', settings.includeDescriptions);
  setCheckboxValue('setting-include-hidden', settings.includeHidden);
  setInputValue('setting-page-behavior', settings.transferPageBehavior);
}

/**
 * Show/hide empty state
 */
function showEmptyState(show: boolean): void {
  toggleElement('empty-state', show);
}

/**
 * Show/hide results
 */
function showResults(show: boolean): void {
  toggleElement('results-container', show);
}

/**
 * Show/hide progress
 */
function showProgress(show: boolean): void {
  toggleElement('progress-container', show);
}

/**
 * Show/hide completion
 */
function showCompletion(show: boolean): void {
  toggleElement('completion-container', show);
}

/**
 * Post message to plugin
 */
function postMessage(message: PluginMessage): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

/**
 * Get element by ID
 */
function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element not found: ${id}`);
  }
  return element;
}

/**
 * Toggle element visibility
 */
function toggleElement(id: string, show: boolean): void {
  const element = getElement(id);
  if (show) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}

/**
 * Get input value
 */
function getInputValue(id: string): string {
  const element = getElement(id) as HTMLInputElement | HTMLSelectElement;
  return element.value;
}

/**
 * Set input value
 */
function setInputValue(id: string, value: string): void {
  const element = getElement(id) as HTMLInputElement | HTMLSelectElement;
  element.value = value;
}

/**
 * Get checkbox value
 */
function getCheckboxValue(id: string): boolean {
  const element = getElement(id) as HTMLInputElement;
  return element.checked;
}

/**
 * Set checkbox value
 */
function setCheckboxValue(id: string, value: boolean): void {
  const element = getElement(id) as HTMLInputElement;
  element.checked = value;
}

/**
 * Format time in milliseconds
 */
function formatTime(ms: number): string {
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
