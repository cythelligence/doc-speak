import { PlaywrightCrawler } from "crawlee";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "./logger";

const logger = new Logger("WebCrawler");

export interface CrawleConfig {
  vendorId: string;
  baseUrl: string;
  includePatterns: RegExp[];
  excludePatterns: RegExp[];
  crawlDepth: number;
  outputPath: string;
}

function isUrlAllowed(url: string, baseUrl: string, includePatterns: RegExp[], excludePatterns: RegExp[]): boolean {
  // Only crawl URLs that start with the baseUrl
  try {
    if (!url.startsWith(baseUrl)) {
      return false;
    }
  } catch {
    return false;
  }

  // Check exclude patterns first
  for (const pattern of excludePatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }

  // Check include patterns
  if (includePatterns.length === 0) {
    return true;
  }

  for (const pattern of includePatterns) {
    if (pattern.test(url)) {
      return true;
    }
  }

  return false;
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
  const crawledUrls: string[] = [];
  const pageContents: Map<string, string> = new Map();
  const visitedUrls = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 0, // No hard limit on requests
    maxRequestsPerMinute: 60,
    navigationTimeoutSecs: 600, // e.g. set navigation timeout to 10 minutes
    requestHandlerTimeoutSecs: 1800, // e.g. set requestHandler timeout to 30 minutes
    maxConcurrency: 5,
    async requestHandler({ request, page, enqueueLinks }: any) {
      const url = request.url;
      const depth = request.userData?.depth || 0;

      // Skip if already visited or depth exceeded
      if (visitedUrls.has(url) || depth > config.crawlDepth) {
        return;
      }

      visitedUrls.add(url);
      logger.info(`Crawling [Depth ${depth}/${config.crawlDepth}]: ${url}`);

      try {
        // Extract main content
        const content = await page.evaluate(() => {
          const main = document.querySelector("main") || document.querySelector("article") || document.body;
          return main?.innerText || "";
        });

        if (content && content.trim().length > 0) {
          pageContents.set(url, content);
          crawledUrls.push(url);
        }

        // Enqueue links matching include patterns and not exceeding depth
        if (depth < config.crawlDepth) {
          await enqueueLinks({
            globs: ["**/*"],
            transformRequestFunction(request: any) {
              const requestUrl = request.url;

              // Check if URL matches our patterns and domain
              if (isUrlAllowed(requestUrl, config.baseUrl, config.includePatterns, config.excludePatterns)) {
                // Set depth for next level
                request.userData = { depth: depth + 1 };
                return request;
              }

              return false;
            },
          });
        }
      } catch (error) {
        logger.error(`Error crawling ${url}`, error);
      }
    },
    async errorHandler({ request }: any, error: Error) {
      logger.error(`Crawl error for ${request.url}: ${error.message}`);
    },
  });

  await crawler.addRequests([
    { url: config.baseUrl, uniqueKey: config.baseUrl, userData: { depth: 0 } },
  ]);

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
