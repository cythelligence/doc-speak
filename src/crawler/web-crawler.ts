import { PlaywrightCrawler } from "crawlee";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "./logger.js";

const logger = new Logger("WebCrawler");

export interface CrawleConfig {
  vendorId: string;
  baseUrl: string;
  includePatterns: RegExp[];
  excludePatterns: RegExp[];
  crawlDepth: number;
  outputPath: string;
}

export async function initializeBrowsers() {
  try {
    logger.info("Checking Playwright browsers...");
    const { execSync } = await import("child_process");
    try {
      execSync("npx playwright install", { stdio: "inherit" });
      logger.info("Playwright browsers installed/verified");
    } catch (error) {
      logger.error("Failed to install Playwright browsers", error);
      throw error;
    }
  } catch (error) {
    logger.error("Browser initialization failed", error);
    throw error;
  }
}

export async function crawlVendor(config: CrawleConfig): Promise<string[]> {
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 500,
    maxRequestsPerMinute: 60,
  });

  const crawledUrls: string[] = [];
  const pageContents: Map<string, string> = new Map();

  crawler.addDefaultHandler(async ({ request, page, enqueueLinks }) => {
    const url = request.url;
    logger.info(`Crawling: ${url}`);

    try {
      // Extract main content
      const content = await page.evaluate(() => {
        const main = document.querySelector("main") || document.querySelector("article") || document.body;
        return main?.innerText || "";
      });

      if (content) {
        pageContents.set(url, content);
        crawledUrls.push(url);
      }

      // Enqueue links matching include patterns
      await enqueueLinks({
        globs: config.includePatterns.map((p) => p.source),
        transformRequestFunction(page) {
          // Default handler
          return page;
        },
      });
    } catch (error) {
      logger.error(`Error crawling ${url}`, error);
    }
  });

  crawler.addErrorHandler(async ({ error, request }) => {
    logger.error(`Crawl error for ${request.url}: ${error.message}`);
  });

  await crawler.addRequests([{ url: config.baseUrl, uniqueKey: config.baseUrl }]);

  await crawler.run();

  // Save crawled content to markdown files
  await saveContentToMarkdown(pageContents, config.outputPath, config.vendorId);

  logger.info(`Crawled ${crawledUrls.length} pages for ${config.vendorId}`);
  return crawledUrls;
}

async function saveContentToMarkdown(
  contents: Map<string, string>,
  outputPath: string,
  vendorId: string
): Promise<void> {
  const vendorPath = path.join(outputPath, vendorId);

  // Create directories if they don't exist
  if (!fs.existsSync(vendorPath)) {
    fs.mkdirSync(vendorPath, { recursive: true });
  }

  for (const [url, content] of contents) {
    const fileName = url
      .replace(/https?:\/\//, "")
      .replace(/[^a-z0-9]/gi, "_")
      .substring(0, 100);

    const mdFile = path.join(vendorPath, `${fileName}.md`);

    const markdown = `# Page Content from ${url}

\`\`\`url
${url}
\`\`\`

## Content

${content}

---
Generated: ${new Date().toISOString()}
`;

    fs.writeFileSync(mdFile, markdown, "utf-8");
  }

  logger.info(`Saved ${contents.size} markdown files to ${vendorPath}`);
}
