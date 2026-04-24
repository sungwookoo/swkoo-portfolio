export interface AlertmanagerAlertStatus {
  state: 'active' | 'suppressed' | 'unprocessed';
  silencedBy?: string[];
  inhibitedBy?: string[];
}

export interface AlertmanagerAlert {
  fingerprint: string;
  status?: AlertmanagerAlertStatus;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  startsAt?: string;
  endsAt?: string;
  updatedAt?: string;
  generatorURL?: string;
  receivers?: Array<{ name?: string }>;
}
