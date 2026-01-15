/**
 * Utilities for persistent storage using Figma's clientStorage
 */

import type { TransferSettings, HistoryEntry } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'transfer_plugin_settings';
const HISTORY_KEY = 'transfer_plugin_history';
const MAX_HISTORY_ENTRIES = 50;

/**
 * Loads settings from storage
 * @returns Promise resolving to settings
 */
export async function loadSettings(): Promise<TransferSettings> {
  try {
    const stored = await figma.clientStorage.getAsync(SETTINGS_KEY);
    if (stored) {
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_SETTINGS, ...stored };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }

  return DEFAULT_SETTINGS;
}

/**
 * Saves settings to storage
 * @param settings - Settings to save
 */
export async function saveSettings(settings: TransferSettings): Promise<void> {
  try {
    await figma.clientStorage.setAsync(SETTINGS_KEY, settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Updates partial settings
 * @param updates - Partial settings to update
 * @returns Promise resolving to updated settings
 */
export async function updateSettings(
  updates: Partial<TransferSettings>
): Promise<TransferSettings> {
  const current = await loadSettings();
  const updated = { ...current, ...updates };
  await saveSettings(updated);
  return updated;
}

/**
 * Resets settings to defaults
 */
export async function resetSettings(): Promise<TransferSettings> {
  await saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * Loads transfer history from storage
 * @returns Promise resolving to history array
 */
export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const stored = await figma.clientStorage.getAsync(HISTORY_KEY);
    if (stored && Array.isArray(stored)) {
      return stored;
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }

  return [];
}

/**
 * Saves transfer history to storage
 * @param history - History array to save
 */
export async function saveHistory(history: HistoryEntry[]): Promise<void> {
  try {
    // Limit history size
    const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
    await figma.clientStorage.setAsync(HISTORY_KEY, trimmed);
  } catch (error) {
    console.error('Error saving history:', error);
    throw new Error('Failed to save history');
  }
}

/**
 * Adds a new entry to history
 * @param entry - History entry to add
 */
export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const history = await loadHistory();
  history.unshift(entry); // Add to beginning
  await saveHistory(history);
}

/**
 * Clears all history
 */
export async function clearHistory(): Promise<void> {
  await saveHistory([]);
}

/**
 * Exports history as JSON string
 * @returns Promise resolving to JSON string
 */
export async function exportHistoryAsJSON(): Promise<string> {
  const history = await loadHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Exports history as CSV string
 * @returns Promise resolving to CSV string
 */
export async function exportHistoryAsCSV(): Promise<string> {
  const history = await loadHistory();

  const headers = [
    'Timestamp',
    'Status',
    'Components Transferred',
    'Variant Sets',
    'Duration (ms)',
    'Warnings',
    'Component Names',
  ];

  const rows = history.map((entry) => [
    new Date(entry.timestamp).toISOString(),
    entry.status,
    entry.stats.componentsTransferred.toString(),
    entry.stats.variantSetsTransferred.toString(),
    entry.duration.toString(),
    entry.warnings.length.toString(),
    entry.componentNames.join('; '),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Exports settings as JSON string
 * @returns Promise resolving to JSON string
 */
export async function exportSettingsAsJSON(): Promise<string> {
  const settings = await loadSettings();
  return JSON.stringify(settings, null, 2);
}

/**
 * Imports settings from JSON string
 * @param json - JSON string to import
 * @returns Promise resolving to imported settings
 */
export async function importSettingsFromJSON(json: string): Promise<TransferSettings> {
  try {
    const settings = JSON.parse(json);
    // Merge with defaults to ensure all fields exist
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    await saveSettings(merged);
    return merged;
  } catch (error) {
    throw new Error('Invalid settings JSON');
  }
}
