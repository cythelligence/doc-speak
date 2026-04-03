export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private timestamp(): string {
    return new Date().toISOString();
  }

  info(message: string, data?: unknown): void {
    console.log(`[${this.timestamp()}] [${this.context}] ℹ️  ${message}`, data || "");
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[${this.timestamp()}] [${this.context}] ⚠️  ${message}`, data || "");
  }

  error(message: string, error?: unknown): void {
    console.error(`[${this.timestamp()}] [${this.context}] ❌ ${message}`, error || "");
  }

  debug(message: string, data?: unknown): void {
    if (process.env.DEBUG === "true") {
      console.debug(`[${this.timestamp()}] [${this.context}] 🔍 ${message}`, data || "");
    }
  }
}
