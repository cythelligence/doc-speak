import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import cron from "node-cron";
import { Logger } from "./logger";
import { crawlVendor } from "./web-crawler";
import { vendors } from "./vendors.config";
import * as path from "path";
import * as os from "os";

const logger = new Logger("CrawlScheduler");

const RAG_DATA_PATH = process.env.RAG_DATA_PATH || path.join(os.homedir(), "Documents", "RAG-Data");

export function startScheduler(): void {
  logger.info("Starting crawl scheduler...");

  // Schedule each vendor based on its refresh interval
  for (const vendor of vendors) {
    const intervalHours = vendor.refreshIntervalHours;
    const cronExpression = `0 */${intervalHours} * * *`; // Run every N hours

    logger.info(`Scheduling ${vendor.id} with interval: ${intervalHours} hours`);

    cron.schedule(cronExpression, async () => {
      logger.info(`Starting scheduled crawl for ${vendor.id}`);
      try {
        await crawlVendor({
          vendorId: vendor.id,
          baseUrl: vendor.baseUrl,
          includePatterns: vendor.includePatterns.map((p) => new RegExp(p)),
          excludePatterns: vendor.excludePatterns.map((p) => new RegExp(p)),
          crawlDepth: vendor.crawlDepth,
          outputPath: RAG_DATA_PATH,
        });
        logger.info(`Successfully crawled ${vendor.id}`);
      } catch (error) {
        logger.error(`Failed to crawl ${vendor.id}`, error);
      }
    });
  }

  logger.info("Crawl scheduler started successfully");
}

export function triggerCrawl(vendorId: string): Promise<String[]> {
  const vendor = vendors.find((v) => v.id === vendorId);
  if (!vendor) {
    throw new Error(`Vendor not found: ${vendorId}`);
  }

  logger.info(`Triggering manual crawl for ${vendorId}`);

  return crawlVendor({
    vendorId: vendor.id,
    baseUrl: vendor.baseUrl,
    includePatterns: vendor.includePatterns.map((p) => new RegExp(p)),
    excludePatterns: vendor.excludePatterns.map((p) => new RegExp(p)),
    crawlDepth: vendor.crawlDepth,
    outputPath: RAG_DATA_PATH,
  });
}
