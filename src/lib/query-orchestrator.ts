import axios from "axios";
import { Logger } from "../crawler/logger.js";
import { searchCollection, listAllCollections } from "./chroma.js";

const logger = new Logger("QueryOrchestrator");

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const COPILOT_API_KEY = process.env.COPILOT_API_KEY;
const COPILOT_ENDPOINT = process.env.COPILOT_ENDPOINT || "https://api.openai.com/v1";
const LLM_PROVIDER = process.env.LLM_PROVIDER || "ollama";
const OLLAMA_MODEL = "mistral"; // Default model, configurable

export interface QueryContext {
  vendorIds: string[];
  query: string;
  maxContext: number;
}

export interface QueryResult {
  answer: string;
  sources: Array<{
    vendorId: string;
    content: string;
    distance: number;
  }>;
  model: string;
  provider: string;
}

async function searchMultipleVendors(
  vendorIds: string[],
  query: string,
  maxResults: number = 5
): Promise<Array<{ vendorId: string; content: string; distance: number }>> {
  const allResults: Array<{ vendorId: string; content: string; distance: number }> = [];

  for (const vendorId of vendorIds) {
    try {
      const results = await searchCollection(vendorId, query, maxResults);
      allResults.push(
        ...results.map((r) => ({
          vendorId,
          content: r.content,
          distance: r.distance,
        }))
      );
    } catch (error) {
      logger.warn(`Failed to search vendor ${vendorId}`, error);
    }
  }

  // Sort by relevance (lowest distance = highest relevance)
  return allResults.sort((a, b) => a.distance - b.distance).slice(0, maxResults * vendorIds.length);
}

function buildContextPrompt(sources: Array<{ vendorId: string; content: string }>): string {
  let context = "# Context from Documentation\n\n";

  const sourcesByVendor = new Map<string, string[]>();
  for (const source of sources) {
    if (!sourcesByVendor.has(source.vendorId)) {
      sourcesByVendor.set(source.vendorId, []);
    }
    sourcesByVendor.get(source.vendorId)!.push(source.content);
  }

  for (const [vendorId, contents] of sourcesByVendor) {
    context += `## From ${vendorId}\n\n`;
    for (let i = 0; i < contents.length; i++) {
      context += `### Section ${i + 1}\n${contents[i]}\n\n`;
    }
  }

  return context;
}

async function queryWithOllama(query: string, context: string): Promise<string> {
  try {
    const response = await axios.post(
      `${OLLAMA_API_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: `${context}\n\nQuestion: ${query}\n\nAnswer:`,
        stream: false,
        temperature: 0.7,
      },
      { timeout: 120000 }
    );

    return response.data.response;
  } catch (error) {
    logger.error("Failed to query Ollama", error);
    throw error;
  }
}

async function queryWithCopilot(query: string, context: string): Promise<string> {
  if (!COPILOT_API_KEY) {
    throw new Error("Copilot API key not configured");
  }

  try {
    const response = await axios.post(
      `${COPILOT_ENDPOINT}/chat/completions`,
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful documentation assistant.",
          },
          {
            role: "user",
            content: `${context}\n\nQuestion: ${query}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${COPILOT_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 120000,
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    logger.error("Failed to query Copilot", error);
    throw error;
  }
}

export async function executeQuery(queryContext: QueryContext): Promise<QueryResult> {
  logger.info(`Executing query: "${queryContext.query}" for vendors: ${queryContext.vendorIds.join(", ")}`);

  // Validate vendor IDs
  if (queryContext.vendorIds.length === 0) {
    throw new Error("No vendor IDs specified");
  }

  try {
    // Search across specified vendors
    const searchResults = await searchMultipleVendors(
      queryContext.vendorIds,
      queryContext.query,
      5
    );

    if (searchResults.length === 0) {
      logger.warn("No search results found");
      return {
        answer: "I could not find relevant information in the selected documentation.",
        sources: [],
        model: LLM_PROVIDER === "copilot" ? "gpt-4" : OLLAMA_MODEL,
        provider: LLM_PROVIDER,
      };
    }

    // Build context from search results
    const contextPrompt = buildContextPrompt(
      searchResults.slice(0, queryContext.maxContext || 10).map((r) => ({
        vendorId: r.vendorId,
        content: r.content,
      }))
    );

    // Generate answer using selected LLM provider
    let answer: string;
    if (LLM_PROVIDER === "copilot") {
      answer = await queryWithCopilot(queryContext.query, contextPrompt);
    } else {
      answer = await queryWithOllama(queryContext.query, contextPrompt);
    }

    logger.info("Query executed successfully");

    return {
      answer,
      sources: searchResults.slice(0, 5).map((r) => ({
        vendorId: r.vendorId,
        content: r.content.substring(0, 200),
        distance: r.distance,
      })),
      model: LLM_PROVIDER === "copilot" ? "gpt-4" : OLLAMA_MODEL,
      provider: LLM_PROVIDER,
    };
  } catch (error) {
    logger.error("Query execution failed", error);
    throw error;
  }
}

export async function getAvailableVendors(): Promise<string[]> {
  try {
    const collections = await listAllCollections();
    return collections
      .filter((c) => c.startsWith("vendor_"))
      .map((c) => c.replace("vendor_", ""));
  } catch (error) {
    logger.error("Failed to get available vendors", error);
    throw error;
  }
}
