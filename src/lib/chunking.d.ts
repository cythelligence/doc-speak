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
export declare function tokenize(text: string): string[];
export declare function estimateTokenCount(text: string): number;
export declare function chunkMarkdownDocument(content: string, sourceFile: string, vendorId: string, pageUrl?: string): DocumentChunk[];
export declare function loadMarkdownFilesFromDirectory(dirPath: string, vendorId: string): Promise<DocumentChunk[]>;
//# sourceMappingURL=chunking.d.ts.map