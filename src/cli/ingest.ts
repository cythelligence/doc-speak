#!/usr/bin/env node

/**
 * Ingestion CLI Script
 * Manually ingest vendor documents into ChromaDB
 * 
 * Usage:
 *   node dist/cli/ingest.js all              # Ingest all vendors
 *   node dist/cli/ingest.js vendor-a         # Ingest specific vendor
 */

import { initializeIngestionPipeline, ingestAllVendors, ingestVendorDocuments } from "../lib/ingestion-pipeline.js";
import { Logger } from "../crawler/logger.js";

const logger = new Logger("IngestionCLI");

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("Ingestion CLI");
    console.log("Usage:");
    console.log("  node dist/cli/ingest.js all              # Ingest all vendors");
    console.log("  node dist/cli/ingest.js <vendor-id>      # Ingest specific vendor");
    process.exit(0);
  }

  try {
    logger.info("Initializing ingestion pipeline...");
    await initializeIngestionPipeline();

    const command = args[0];

    if (command === "all") {
      logger.info("Ingesting all vendors...");
      await ingestAllVendors();
    } else {
      logger.info(`Ingesting vendor: ${command}`);
      await ingestVendorDocuments(command);
    }

    logger.info("✅ Ingestion completed successfully");
  } catch (error) {
    logger.error("❌ Ingestion failed", error);
    process.exit(1);
  }
}

main();
