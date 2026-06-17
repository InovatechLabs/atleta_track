export type ProfileItem = {
  profile: string;
  count: number;
};

export type ComparisonData = {
  avgSpeedKph: string;
  maxSpeedKph: string;
};

export type AlertItem = {
  severity: string;
  metric: string;
  dropPercent: number;
};

export type PreviewData = {
  profiles: ProfileItem[];
  comparison: ComparisonData;
  recentAlerts: AlertItem[];
};
