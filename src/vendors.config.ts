export interface VendorConfig {
  id: string;
  name: string;
  baseUrl: string;
  includePatterns: string[];
  excludePatterns: string[];
  crawlDepth: number;
  refreshIntervalHours: number;
}

export const vendors: VendorConfig[] = [
  {
    id: "vendor-a",
    name: "Vendor A Documentation",
    baseUrl: "https://docs.vendor-a.com",
    includePatterns: ["https://docs.vendor-a.com/.*"],
    excludePatterns: [".*\\.pdf$", ".*search.*"],
    crawlDepth: 3,
    refreshIntervalHours: 24
  },
  {
    id: "vendor-b",
    name: "Vendor B Documentation",
    baseUrl: "https://docs.vendor-b.com",
    includePatterns: ["https://docs.vendor-b.com/.*"],
    excludePatterns: [".*\\.pdf$", ".*search.*"],
    crawlDepth: 3,
    refreshIntervalHours: 24
  }
];
