import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

export interface VendorConfig {
  id: string;
  name: string;
  baseUrl: string;
  includePatterns: string[];
  excludePatterns: string[];
  crawlDepth: number;
  refreshIntervalHours: number;
}

interface VendorsConfigFile {
  vendors: VendorConfig[];
}

let cachedVendors: VendorConfig[] | null = null;

export function loadVendors(): VendorConfig[] {
  if (cachedVendors) {
    return cachedVendors;
  }

  const configPath = path.join(__dirname, "../config/vendors.yaml");

  if (!fs.existsSync(configPath)) {
    throw new Error(`Vendors configuration file not found at ${configPath}`);
  }

  try {
    const fileContent = fs.readFileSync(configPath, "utf-8");
    const config = yaml.load(fileContent) as VendorsConfigFile;

    if (!config.vendors || !Array.isArray(config.vendors)) {
      throw new Error("Invalid vendors configuration: 'vendors' array not found");
    }

    cachedVendors = config.vendors;
    return cachedVendors;
  } catch (error) {
    throw new Error(
      `Failed to load vendors configuration: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export const vendors: VendorConfig[] = loadVendors();
