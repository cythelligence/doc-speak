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
export declare function executeQuery(queryContext: QueryContext): Promise<QueryResult>;
export declare function getAvailableVendors(): Promise<string[]>;
//# sourceMappingURL=query-orchestrator.d.ts.map