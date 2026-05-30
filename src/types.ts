export type Platform = 'android' | 'macos' | 'ios';

export type ClickType = 'single' | 'double' | 'hold';

export interface ClickConfig {
  intervalMs: number;
  clickType: ClickType;
  coordinateMode: 'current' | 'custom';
  customX: number;
  customY: number;
  stopOnInfinite: boolean;
  stopOnCount: boolean;
  stopCountValue: number;
  stopOnDuration: boolean;
  stopDurationValue: number; // in seconds
}

export interface CodeFile {
  name: string;
  path: string;
  language: 'dart' | 'kotlin' | 'swift' | 'yaml' | 'xml';
  content: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'click';
}
