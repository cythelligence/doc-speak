export declare class Logger {
    private context;
    constructor(context: string);
    private timestamp;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, error?: unknown): void;
    debug(message: string, data?: unknown): void;
}
//# sourceMappingURL=logger.d.ts.map