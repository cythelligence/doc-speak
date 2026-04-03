import * as path from "path";
import * as os from "os";
import { Logger } from "../crawler/logger";
import { vendors } from "../vendors.config";
import {
  loadMarkdownFilesFromDirectory,
} from "./chunking";
import {
  initializeChromaDB,
  createVendorCollection,
  upsertDocumentChunks,
  getCollectionStats,
} from "./chroma";
import { checkOllamaConnection, pullEmbeddingModel } from "./embeddings";

const logger = new Logger("IngestionPipeline");

const RAG_DATA_PATH = path.join(os.homedir(), "Documents", "RAG-Data", "raw");

export async function initializeIngestionPipeline(): Promise<void> {
  logger.info("Initializing Ingestion Pipeline...");

  // Check Ollama connection
  const ollamaConnected = await checkOllamaConnection();
  if (!ollamaConnected) {
    throw new Error(
      "Ollama is not running. Please start Ollama on localhost:11434"
    );
  }

  // Ensure embedding model is available
  try {
    await pullEmbeddingModel();
  } catch (error) {
    logger.warn("Failed to pull embedding model", error);
  }

  // Initialize ChromaDB
  await initializeChromaDB();

  logger.info("Ingestion Pipeline initialized successfully");
}

export async function ingestVendorDocuments(vendorId: string): Promise<void> {
  if (!vendors.find((v) => v.id === vendorId)) {
    throw new Error(`Vendor not found: ${vendorId}`);
  }

  logger.info(`Starting ingestion for vendor: ${vendorId}`);

  try {
    // Load markdown files from the vendor's folder
    const vendorDataPath = path.join(RAG_DATA_PATH, vendorId);
    const chunks = await loadMarkdownFilesFromDirectory(vendorDataPath, vendorId);

    if (chunks.length === 0) {
      logger.warn(`No chunks found for vendor ${vendorId}. Make sure to crawl first.`);
      return;
    }

    // Create vector collection for the vendor
    await createVendorCollection(vendorId);

    // Upsert chunks into ChromaDB
    await upsertDocumentChunks(vendorId, chunks);

    // Log statistics
    const stats = await getCollectionStats(vendorId);
    logger.info(`Ingestion complete for ${vendorId}. Collection has ${stats.count} documents.`);
  } catch (error) {
    logger.error(`Failed to ingest documents for vendor ${vendorId}`, error);
    throw error;
  }
}

export async function ingestAllVendors(): Promise<void> {
  logger.info("Starting bulk ingestion for all vendors...");

  for (const vendor of vendors) {
    try {
      await ingestVendorDocuments(vendor.id);
    } catch (error) {
      logger.error(`Failed to ingest vendor ${vendor.id}`, error);
      // Continue with next vendor
    }
  }

  logger.info("Bulk ingestion completed");
}
