import { ChromaClient } from "chromadb";
import type { DocumentChunk } from "./chunking";
export declare function initializeChromaDB(): Promise<ChromaClient>;
export declare function getChromaClient(): ChromaClient;
export declare function createVendorCollection(vendorId: string, collectionName?: string): Promise<string>;
export declare function upsertDocumentChunks(vendorId: string, chunks: DocumentChunk[]): Promise<void>;
export declare function searchCollection(vendorId: string, query: string, nResults?: number): Promise<Array<{
    content: string;
    metadata: Record<string, unknown>;
    distance: number;
}>>;
export declare function getCollectionStats(vendorId: string): Promise<{
    count: number;
    name: string;
}>;
export declare function listAllCollections(): Promise<string[]>;
//# sourceMappingURL=chroma.d.ts.map