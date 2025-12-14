import { LogEntry } from '../types';

export class BaseAgent {
  protected name: string;
  protected onLog: (entry: LogEntry) => void;

  constructor(name: string, onLog: (entry: LogEntry) => void) {
    this.name = name;
    this.onLog = onLog;
  }

  protected log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      agent: this.name,
      message,
      type
    };
    // Console log for debugging
    console.log(`[${entry.timestamp}] [${this.name}] ${message}`);
    this.onLog(entry);
  }
}