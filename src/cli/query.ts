#!/usr/bin/env node

/**
 * Query CLI Script
 * Test queries from the command line
 * 
 * Usage:
 *   node dist/cli/query.js "Your question" vendor-a vendor-b
 */

import { initializeChromaDB } from "../lib/chroma";
import { executeQuery } from "../lib/query-orchestrator";
import { Logger } from "../crawler/logger";

const logger = new Logger("QueryCLI");

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Query CLI");
    console.log("Usage:");
    console.log('  node dist/cli/query.js "Your question" vendor-a vendor-b');
    console.log("\nExample:");
    console.log('  node dist/cli/query.js "How do I install the package?" docs-vendor');
    process.exit(0);
  }

  const query = args[0];
  const vendorIds = args.slice(1);

  try {
    logger.info("Initializing ChromaDB...");
    await initializeChromaDB();

    logger.info(`Querying with: "${query}"`);
    logger.info(`Vendors: ${vendorIds.join(", ")}`);

    const result = await executeQuery({
      vendorIds,
      query,
      maxContext: 10,
    });

    console.log("\n📝 Answer:");
    console.log("─".repeat(80));
    console.log(result.answer);
    console.log("─".repeat(80));

    console.log(`\n📚 Sources (${result.sources.length}):`);
    result.sources.forEach((source, i) => {
      console.log(`\n${i + 1}. From ${source.vendorId}`);
      console.log(`   Distance: ${source.distance.toFixed(4)}`);
      console.log(`   Content: ${source.content.substring(0, 150)}...`);
    });

    console.log(`\n🤖 Model: ${result.model} (${result.provider})`);
  } catch (error) {
    logger.error("Query failed", error);
    process.exit(1);
  }
}

main();
