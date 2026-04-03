#!/usr/bin/env node

/**
 * Vendors CLI Script
 * List all available vendors
 * 
 * Usage:
 *   node dist/cli/vendors.js list
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { Logger } from "../crawler/logger";

const logger = new Logger("VendorsCLI");

interface Vendor {
  id: string;
  name: string;
  baseUrl: string;
  [key: string]: any;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "list") {
    try {
      const configPath = path.join(process.cwd(), "config", "vendors.yaml");
      
      if (!fs.existsSync(configPath)) {
        logger.error(`Vendors config not found at ${configPath}`);
        process.exit(1);
      }

      const fileContents = fs.readFileSync(configPath, "utf8");
      const config = yaml.load(fileContents) as { vendors: Vendor[] };

      if (!config.vendors || config.vendors.length === 0) {
        logger.info("No vendors configured");
        process.exit(0);
      }

      console.log("\n📚 Available Vendors:");
      console.log("─".repeat(80));

      config.vendors.forEach((vendor, index) => {
        console.log(`${index + 1}. ${vendor.name} (ID: ${vendor.id})`);
        console.log(`   URL: ${vendor.baseUrl}`);
      });

      console.log("─".repeat(80));
      console.log(`\nTotal: ${config.vendors.length} vendor(s)\n`);
    } catch (error) {
      logger.error("Failed to list vendors", error);
      process.exit(1);
    }
  } else {
    console.log("Vendors CLI");
    console.log("Usage:");
    console.log("  node dist/cli/vendors.js list    # List all available vendors");
    process.exit(0);
  }
}

main();
