import { Logger } from "../crawler/logger";

const logger = new Logger("Embeddings");

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const EMBEDDING_MODEL = "nomic-embed-text";

function createAbortSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, timeoutMs);
  
  // Clean up timeout if request completes before timeout
  if (controller.signal.addEventListener) {
    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  }
  
  return controller.signal;
}

export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      signal: createAbortSignal(5000),
    });
    const data = await response.json();
    logger.info("Ollama connection successful", data);
    return true;
  } catch (error) {
    logger.error("Ollama connection failed", error);
    return false;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        prompt: text,
      }),
      signal: createAbortSignal(30000),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error(`Ollama request timeout for embedding (30s): ${text.substring(0, 50)}...`);
    } else {
      logger.error(`Failed to generate embedding for text: ${text.substring(0, 50)}...`, error);
    }
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

    const response = await fetch(`${OLLAMA_API_URL}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: EMBEDDING_MODEL,
        stream: false,
      }),
      signal: createAbortSignal(300000), // 5 minutes timeout for model pulling
    });

    const data = await response.json();
    logger.info(`Successfully pulled model: ${EMBEDDING_MODEL}`, data);
  } catch (error) {
    logger.error(`Failed to pull embedding model`, error);
    throw error;
  }
}
