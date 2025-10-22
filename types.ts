export type AppState = 'setup' | 'running' | 'report';

export interface FuzzingConfig {
  binaryName: string;
  dbName?: string;
  timeBudget: number;
  cpuCores: number;
  memoryLimit: number;
  coverageTarget: number;
}

export interface Crash {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  type: 'Memory Safety' | 'Undefined Behavior' | 'Logic Bug' | 'DoS Potential';
  summary: string;
  stackTrace: string;
  reproducibleTestCase: string;
  timestamp: number;
  originalOutput: string;
  faultyOutput: string;
}

export interface CrashAnalysis {
  vulnerabilityPattern: string;
  potentialImpact: string;
  detailedExplanation: string;
}

export interface CoveragePoint {
  time: number;
  coverage: number;
}

export interface LogEntry {
  time: number;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface SeedFile {
  filename: string;
  content: string;
}

export interface FuzzingReport {
  totalDuration: number;
  finalCoverage: number;
  totalExecs: number;
  crashes: Crash[];
  coverageTimeline: CoveragePoint[];
  logs: LogEntry[];
  execsPerSec: number;
  grammarPy: string;
  seedCorpus: SeedFile[];
  reproductionGuide: string;
}