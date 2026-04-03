import axios from "axios";
import { Logger } from "../crawler/logger.js";

const logger = new Logger("Embeddings");

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const EMBEDDING_MODEL = "nomic-embed-text";

export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_API_URL}/api/tags`, { timeout: 5000 });
    logger.info("Ollama connection successful", response.data);
    return true;
  } catch (error) {
    logger.error("Ollama connection failed", error);
    return false;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post(
      `${OLLAMA_API_URL}/api/embeddings`,
      {
        model: EMBEDDING_MODEL,
        prompt: text,
      },
      { timeout: 30000 }
    );

    return response.data.embedding;
  } catch (error) {
    logger.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`, error);
    throw error;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  logger.info(`Generating embeddings for ${texts.length} texts`);

  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i++) {
    try {
      const embedding = await generateEmbedding(texts[i]);
      embeddings.push(embedding);

      if ((i + 1) % 10 === 0) {
        logger.debug(`Generated ${i + 1}/${texts.length} embeddings`);
      }
    } catch (error) {
      logger.error(`Failed to generate embedding at index ${i}`, error);
      throw error;
    }
  }

  logger.info(`Successfully generated ${embeddings.length} embeddings`);
  return embeddings;
}

export async function pullEmbeddingModel(): Promise<void> {
  try {
    logger.info(`Pulling embedding model: ${EMBEDDING_MODEL}`);

    const response = await axios.post(
      `${OLLAMA_API_URL}/api/pull`,
      {
        name: EMBEDDING_MODEL,
        stream: false,
      },
      { timeout: 300000 } // 5 minutes timeout for model pulling
    );

    logger.info(`Successfully pulled model: ${EMBEDDING_MODEL}`, response.data);
  } catch (error) {
    logger.error(`Failed to pull embedding model`, error);
    throw error;
  }
}
