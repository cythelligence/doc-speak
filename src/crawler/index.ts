import { initializeBrowsers, crawlVendor } from "./web-crawler";
import { startScheduler } from "./scheduler";
import { Logger } from "./logger";
import { vendors } from "../vendors.config";
import * as path from "path";
import * as os from "os";

const logger = new Logger("CrawlerMain");

const RAG_DATA_PATH = path.join(os.homedir(), "Documents", "RAG-Data", "raw");

async function main() {
  try {
    logger.info("========================================");
    logger.info("🚀 Starting Doc-Speak Crawler");
    logger.info("========================================");

    // Initialize browsers
    await initializeBrowsers();

    // Perform initial crawl for all vendors
    logger.info("Performing initial crawl...");
    for (const vendor of vendors) {
      try {
        logger.info(`Crawling ${vendor.name}...`);
        await crawlVendor({
          vendorId: vendor.id,
          baseUrl: vendor.baseUrl,
          includePatterns: vendor.includePatterns.map((p) => new RegExp(p)),
          excludePatterns: vendor.excludePatterns.map((p) => new RegExp(p)),
          crawlDepth: vendor.crawlDepth,
          outputPath: RAG_DATA_PATH,
        });
      } catch (error) {
        logger.error(`Failed to crawl ${vendor.name}`, error);
      }
    }

    // Start scheduler for periodic crawls
    logger.info("Starting crawl scheduler...");
    startScheduler();

    logger.info("✅ Crawler is running. Press Ctrl+C to stop.");
  } catch (error) {
    logger.error("Fatal error in crawler", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down gracefully...");
  process.exit(0);
});

main();
