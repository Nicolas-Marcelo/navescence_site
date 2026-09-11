export interface ScanReading {
  scanner?: string;
  name?: string;
  mac?: string;
  readings?: number;
  validReadings?: number;
  discardedReadings?: number;
  averageRssi?: number;
  m15?: number;
  minRssi?: number;
  maxRssi?: number;
  advertising?: string;
}