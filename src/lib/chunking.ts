import * as fs from "fs";
import * as path from "path";
import { Logger } from "../crawler/logger";

const logger = new Logger("VectorStorage");

// Chunk size configuration
const TOKEN_LIMIT = 1000;
const OVERLAP_PERCENTAGE = 0.1;

export interface ChunkMetadata {
  source: string;
  vendorId: string;
  pageUrl?: string;
  chunkIndex: number;
  totalChunks: number;
  createdAt: string;
}

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
  tokenCount: number;
}

export function tokenize(text: string): string[] {
  // Simple tokenization: split by spaces and punctuation
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

export function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export function chunkMarkdownDocument(
  content: string,
  sourceFile: string,
  vendorId: string,
  pageUrl?: string
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const paragraphs = content.split(/\n\n+/);

  let currentChunk = "";
  let chunkIndex = 0;
  const overlapTokens = Math.floor(TOKEN_LIMIT * OVERLAP_PERCENTAGE);

  for (const paragraph of paragraphs) {
    const paragraphTokens = tokenize(paragraph);
    const currentTokens = tokenize(currentChunk);

    if (currentTokens.length + paragraphTokens.length > TOKEN_LIMIT) {
      // Save the current chunk
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            source: sourceFile,
            vendorId,
            pageUrl,
            chunkIndex,
            totalChunks: 0, // Will be updated after all chunks are created
            createdAt: new Date().toISOString(),
          },
          tokenCount: estimateTokenCount(currentChunk),
        });
        chunkIndex++;

        // Create overlap for context continuity
        const overlapContent = currentChunk.split(/\s+/).slice(-overlapTokens).join(" ");
        currentChunk = overlapContent + "\n\n" + paragraph;
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        source: sourceFile,
        vendorId,
        pageUrl,
        chunkIndex,
        totalChunks: chunks.length + 1,
        createdAt: new Date().toISOString(),
      },
      tokenCount: estimateTokenCount(currentChunk),
    });
  }

  // Update totalChunks for all chunks
  const totalChunks = chunks.length;
  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = totalChunks;
  });

  logger.debug(
    `Chunked document ${sourceFile}: ${chunks.length} chunks`,
    `Total tokens estimated: ${chunks.reduce((sum, c) => sum + c.tokenCount, 0)}`
  );

  return chunks;
}

export async function loadMarkdownFilesFromDirectory(
  dirPath: string,
  vendorId: string
): Promise<DocumentChunk[]> {
  const allChunks: DocumentChunk[] = [];

  if (!fs.existsSync(dirPath)) {
    logger.warn(`Directory not found: ${dirPath}`);
    return allChunks;
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    logger.debug(`Processing file: ${filePath}`);

    try {
      const content = fs.readFileSync(filePath, "utf-8");

      // Extract URL from the markdown if available
      const urlMatch = content.match(/\`\`\`url\s+(https?:\/\/[^\s]+)\s*\`\`\`/);
      const pageUrl = urlMatch?.[1];

      const chunks = chunkMarkdownDocument(content, file, vendorId, pageUrl);
      allChunks.push(...chunks);
    } catch (error) {
      logger.error(`Error processing file ${file}`, error);
    }
  }

  logger.info(`Loaded ${files.length} files from ${dirPath}, created ${allChunks.length} chunks`);
  return allChunks;
}
