import { ChromaClient } from "chromadb";
import * as path from "path";
import * as os from "os";
import { Logger } from "../crawler/logger.js";
import type { DocumentChunk } from "./chunking.js";
import { generateEmbeddings } from "./embeddings.js";

const logger = new Logger("ChromaDB");

const CHROMA_DATA_PATH = process.env.CHROMA_DATA_PATH || path.join(os.homedir(), ".chroma");

let chromaClient: ChromaClient | null = null;

export async function initializeChromaDB(): Promise<ChromaClient> {
  try {
    logger.info(`Initializing ChromaDB with data path: ${CHROMA_DATA_PATH}`);

    // Initialize ChromaDB client with persistent storage
    chromaClient = new ChromaClient({
      path: CHROMA_DATA_PATH,
    });

    logger.info("ChromaDB initialized successfully");
    return chromaClient;
  } catch (error) {
    logger.error("Failed to initialize ChromaDB", error);
    throw error;
  }
}

export function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    throw new Error("ChromaDB not initialized. Call initializeChromaDB first.");
  }
  return chromaClient;
}

export async function createVendorCollection(vendorId: string, collectionName?: string): Promise<string> {
  const client = getChromaClient();
  const name = collectionName || `vendor_${vendorId}`;

  try {
    // Delete existing collection if it exists (to avoid duplicates)
    try {
      await client.deleteCollection({ name });
      logger.info(`Deleted existing collection: ${name}`);
    } catch (e) {
      // Collection doesn't exist, that's fine
    }

    // Create new collection
    const collection = await client.createCollection({
      name,
      metadata: {
        vendor_id: vendorId,
        created_at: new Date().toISOString(),
      },
    });

    logger.info(`Created collection: ${name}`);
    return name;
  } catch (error) {
    logger.error(`Failed to create collection ${name}`, error);
    throw error;
  }
}

export async function upsertDocumentChunks(
  vendorId: string,
  chunks: DocumentChunk[]
): Promise<void> {
  const client = getChromaClient();
  const collectionName = `vendor_${vendorId}`;

  try {
    // Ensure collection exists
    await createVendorCollection(vendorId, collectionName);

    const collection = await client.getCollection({ name: collectionName });

    logger.info(`Upserting ${chunks.length} chunks into collection ${collectionName}`);

    // Generate embeddings for all chunks
    const contents = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(contents);

    // Prepare documents for upsert
    const ids = chunks.map((_, i) => `chunk_${vendorId}_${i}`);
    const documents = contents;
    const metadatas = chunks.map((c) => ({
      source: c.metadata.source,
      vendor_id: vendorId,
      page_url: c.metadata.pageUrl || "",
      chunk_index: c.metadata.chunkIndex,
      total_chunks: c.metadata.totalChunks,
    }));

    // Upsert in batches
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, chunks.length);
      const batchIds = ids.slice(i, batchEnd);
      const batchDocuments = documents.slice(i, batchEnd);
      const batchEmbeddings = embeddings.slice(i, batchEnd);
      const batchMetadatas = metadatas.slice(i, batchEnd);

      await collection.upsert({
        ids: batchIds,
        documents: batchDocuments,
        embeddings: batchEmbeddings,
        metadatas: batchMetadatas,
      });

      logger.debug(`Upserted batch ${i / batchSize + 1} (${batchSize} chunks)`);
    }

    logger.info(`Successfully upserted ${chunks.length} chunks`);
  } catch (error) {
    logger.error(`Failed to upsert chunks for vendor ${vendorId}`, error);
    throw error;
  }
}

export async function searchCollection(
  vendorId: string,
  query: string,
  nResults: number = 5
): Promise<Array<{ content: string; metadata: Record<string, unknown>; distance: number }>> {
  const client = getChromaClient();
  const collectionName = `vendor_${vendorId}`;

  try {
    const collection = await client.getCollection({ name: collectionName });

    // Generate embedding for query
    const { generateEmbedding } = await import("./embeddings.js");
    const queryEmbedding = await generateEmbedding(query);

    // Search in collection
    const results = await collection.query({
      query_embeddings: [queryEmbedding],
      n_results: nResults,
    });

    const formattedResults = [];
    if (results.documents && results.documents[0]) {
      for (let i = 0; i < results.documents[0].length; i++) {
        formattedResults.push({
          content: results.documents[0][i],
          metadata: (results.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
          distance: results.distances?.[0]?.[i] ?? 0,
        });
      }
    }

    logger.debug(`Found ${formattedResults.length} results for query in ${collectionName}`);
    return formattedResults;
  } catch (error) {
    logger.error(`Failed to search collection ${collectionName}`, error);
    throw error;
  }
}

export async function getCollectionStats(vendorId: string): Promise<{ count: number; name: string }> {
  const client = getChromaClient();
  const collectionName = `vendor_${vendorId}`;

  try {
    const collection = await client.getCollection({ name: collectionName });
    const count = await collection.count();

    logger.info(`Collection ${collectionName} has ${count} documents`);
    return { count, name: collectionName };
  } catch (error) {
    logger.error(`Failed to get stats for collection ${collectionName}`, error);
    throw error;
  }
}

export async function listAllCollections(): Promise<string[]> {
  const client = getChromaClient();

  try {
    const collections = await client.listCollections();
    const collectionNames = collections.map((c) => c.name);

    logger.info(`Found ${collectionNames.length} collections`);
    return collectionNames;
  } catch (error) {
    logger.error("Failed to list collections", error);
    throw error;
  }
}
