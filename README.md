# Doc-Speak: Native Local Modular RAG System

A comprehensive local-first RAG (Retrieval-Augmented Generation) system built with TypeScript, Express.js, Crawlee, ChromaDB, and Ollama. All components run natively on your machine without Docker.

## Features

✨ **Features**

- 🕷️ **Native Web Crawler**: Automatic documentation crawling with Crawlee + Playwright
- 📘 **Local Vector Storage**: ChromaDB running as a persistent local client
- 🤖 **Multi-LLM Support**: Ollama (local) or Microsoft Copilot
- 🎯 **Multi-Vendor Queries**: Search across multiple documentation sources simultaneously
- 💬 **Chat Interface**: Beautiful web UI built with Express.js + vanilla JS + Tailwind CSS
- 📊 **Chat History**: SQLite-backed conversation persistence
- ⚙️ **Configurable Scheduling**: Automatic documentation refresh via cron
- 🔧 **TypeScript Strict Mode**: Type-safe throughout

## Architecture

### Module A: Web Crawler & Scheduler ✅

- Crawls documentation using Crawlee (Playwright-based)
- Converts HTML to Markdown format
- Saves to local filesystem: `~/Documents/RAG-Data/raw/[vendor_id]`
- Scheduled refresh cycles via node-cron
- Fully automated per-vendor refresh intervals (configurable in `vendors.yaml`)

### Module B: Ingestion & Vector Storage ✅

- Parses Markdown documents from filesystem
- Chunks with 1000-token limit and 10% overlap
- Generates embeddings via local Ollama (nomic-embed-text)
- Stores in ChromaDB with unique collections per vendor
- Batch processing with automatic model management

### Module C: Query Orchestrator ✅

- Routes queries to appropriate vendor collections
- Supports single and multi-vendor searches
- Aggregates context from multiple sources
- Switches between Ollama (local) and Copilot/OpenAI LLMs

### Module D: Web Interface ⚠️

- **Express.js API server** with vanilla HTML/JS frontend
- Midnight Navy (#001529) + Vibrant Cyan (#00E5FF) design
- Multi-select vendor sidebar
- Threaded chat with SQLite persistence
- Responsive and beautiful UI
- Note: React components exist but are not yet integrated (future Next.js migration)

## Prerequisites

### Required

- **Node.js v20+** (install via [nvm](https://github.com/nvm-sh/nvm) or [direct download](https://nodejs.org/))
- **Ollama** desktop app (for local embeddings and LLM)
  - macOS: `brew install ollama` or download from [ollama.ai](https://ollama.ai)
  - Linux: Download from [ollama.ai](https://ollama.ai)
  - Windows: Download from [ollama.ai](https://ollama.ai)
- **ChromaDB** (vector database for document storage)
  - macOS: `pip install chromadb` (requires Python 3.9+)
  - Linux: `pip install chromadb`
  - Windows: `pip install chromadb` (requires Python 3.9+)
  - Or install via npm: `npm install chromadb` (included in project dependencies)

### Optional

- **Docker** (for ChromaDB server mode, not required for basic usage)
- **Git** (for version control)

## Installation

### 1. Clone or Initialize the Project

```bash
cd /path/to/doc-speak
```

### 2. Run Setup Script

**macOS/Linux:**

```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**

```bash
setup.bat
```

This will:

- Install all npm dependencies
- Create required directories
- Initialize Prisma database
- Verify Node.js version
- Check for Ollama installation

### 3. Install and Start ChromaDB

First, install ChromaDB:

```bash
# macOS/Linux with pip (requires Python 3.9+)
pip install chromadb

# Or via npm (alternative)
npm install -g chromadb
```

Then start the ChromaDB server:

```bash
chroma run --host localhost --path ./chroma_data
```

Alternatively, run chromadb server via npx:

```bash
npx chromadb run --path ./chroma_data
```

By default, the server runs on localhost on the port 8000.

For server mode, update `.env.local`:

```env
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false
```

### 4. Start Ollama

In a separate terminal:

```bash
ollama serve
```

This starts Ollama on `localhost:11434` with default settings.

### 5. Pull Required Models

In another terminal, ensure the embedding model is available:

```bash
ollama pull nomic-embed-text
ollama pull mistral  # or your preferred model
```

## Configuration

### Environment Variables (`.env.local`)

```env
# Ollama Configuration (for embeddings and LLM)
OLLAMA_API_URL=http://localhost:11434

# ChromaDB Configuration (Vector Database)
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_SSL=false

# Microsoft Copilot/OpenAI Configuration (optional, alternative to Ollama)
COPILOT_API_KEY=your_api_key_here
COPILOT_ENDPOINT=https://api.openai.com/v1

# LLM Provider: 'ollama' (default) or 'copilot'
LLM_PROVIDER=ollama

# Crawler Configuration
RAG_DATA_PATH=~/Documents/RAG-Data
CRAWLER_USER_AGENT=Mozilla/5.0 (compatible; DocSpeak/1.0)

# Database
DATABASE_URL=file:./chroma_data/chat.db

# App Configuration
NODE_ENV=development
PORT=3000
```

**Important Notes:**

- `.env.local` is loaded automatically by the app (never commit to git)
- `OLLAMA_API_URL` must point to running Ollama instance
- `CHROMA_HOST` and `CHROMA_PORT` must match your ChromaDB server (default: localhost:8000)
- `CHROMA_SSL` set to `true` if ChromaDB uses HTTPS
- `LLM_PROVIDER=ollama` uses local models (recommended for privacy)
- `LLM_PROVIDER=copilot` requires valid API key and internet connection

### Vendor Configuration (`config/vendors.yaml`)

```yaml
vendors:
  - id: vendor-a
    name: Vendor A Documentation
    baseUrl: https://docs.vendor-a.com
    includePatterns:
      - https://docs.vendor-a.com/.*
    excludePatterns:
      - .*\.pdf$           # Exclude PDFs
      - .*search.*         # Exclude search pages
    crawlDepth: 3          # How deep to crawl from baseUrl
    refreshIntervalHours: 24  # Auto-refresh interval
  - id: vendor-b
    name: Vendor B Documentation
    baseUrl: https://docs.vendor-b.com
    includePatterns:
      - https://docs.vendor-b.com/.*
    excludePatterns:
      - .*\.pdf$
      - .*search.*
    crawlDepth: 3
    refreshIntervalHours: 24
```

**Configuration Options**:

- `id`: Unique identifier for the vendor (used in APIs and CLI)
- `name`: Display name for the UI
- `baseUrl`: Starting URL for crawler
- `includePatterns`: Regex patterns for URLs to include
- `excludePatterns`: Regex patterns for URLs to skip
- `crawlDepth`: Maximum depth to follow links (0-5 recommended)
- `refreshIntervalHours`: How often to automatically re-crawl (0 = disable scheduling)

## Usage

### Development

Start all services concurrently (crawler + web app):

```bash
npm run dev
```

This:

1. Starts the crawler scheduler in watch mode (background process)
2. Starts the Express.js API server on `http://localhost:3000`
3. Opens the web UI at `http://localhost:3000`

### Individual Commands

```bash
# API server only (vanilla JS UI)
npm run server:dev

# Build server for production
npm run server:build

# Crawler only (one-time run of all vendors)
npm run crawler:run

# Watch crawler files during development
npm run crawler:watch

# Build crawler for production
npm run crawler:build

# Build both server and crawler
npm run build

# Start production server
npm start

# Database management
npm run db:migrate        # Run Prisma migrations
npm run db:studio        # Open Prisma Studio UI

# CLI utilities
npm run crawler:build && node dist/cli/ingest.js all                    # Ingest all vendors
npm run crawler:build && node dist/cli/ingest.js vendor-id              # Ingest specific vendor
npm run crawler:build && node dist/cli/query.js "question" vendor-a     # Test query via CLI
```

### Workflow

1. **Configure Vendors**: Edit `config/vendors.yaml` with your documentation URLs and refresh intervals
2. **Start Services**: Run `npm run dev` to start crawler scheduler + API server
3. **Data Collection**:
   - **Automatic**: Crawls and ingestion run on configured schedule
   - **Manual**: Use CLI commands for immediate operations
4. **Ingest Documents**:
   - Automatic: Triggered after each crawl cycle
   - Manual: Run `npm run crawler:build && node dist/cli/ingest.js vendor-id`
5. **Query Documentation**:
   - Open `http://localhost:3000`
   - Select vendors (multi-select supported)
   - Create new chat session
   - Ask questions across selected documentation

6. **View History**: All conversations persist in SQLite database

## API Endpoints

### Sessions Management

- `GET /api/sessions` - List all chat sessions with metadata
- `POST /api/sessions` - Create new session
  - Required: `title` (string)
  - Optional: `vendorIds` (string array)
- `GET /api/sessions/[sessionId]/messages` - Get all messages in a session

### Chat Operations

- `POST /api/chat/[sessionId]` - Send message and get RAG response
  - Required: `message` (string), `vendorIds` (string array)
  - Returns: user message, assistant response, sources, model info

### Vendor Management

- `GET /api/vendors` - List available vendors with collection status

### Crawler & Ingestion

- **Manual crawling**: Use CLI `npm run crawler:run` (runs all vendors) or configure scheduled crawls in `vendors.yaml`
- **Manual ingestion**: Use CLI `npm run crawler:build && node dist/cli/ingest.js [vendor-id]`
- Future: REST API endpoints for manual operations (planned feature)

## Project Structure

```shell
doc-speak/
├── src/
│   ├── server/                       # Express.js API server
│   │   └── index.ts                  # API routes and server
│   ├── crawler/                      # Module A: Web Crawler
│   │   ├── index.ts                  # CLI entry point
│   │   ├── web-crawler.ts            # Crawlee integration
│   │   ├── scheduler.ts              # Node-cron scheduler
│   │   └── logger.ts                 # Logging utilities
│   ├── lib/                          # Shared utilities
│   │   ├── chunking.ts               # Module B: Document chunking
│   │   ├── embeddings.ts             # Ollama embeddings
│   │   ├── chroma.ts                 # ChromaDB client
│   │   ├── ingestion-pipeline.ts     # Module B: Ingestion orchestrator
│   │   └── query-orchestrator.ts     # Module C: Query routing & LLM
│   ├── cli/                          # Command-line tools
│   │   ├── ingest.ts                 # Manual ingestion CLI
│   │   └── query.ts                  # Query testing CLI
│   └── components/                   # React components (future use)
│       ├── ChatSidebar.tsx
│       └── ChatView.tsx
├── prisma/
│   └── schema.prisma                 # Database schema (SQLite via LibSQL)
├── public/                           # Static assets & vanilla JS UI
│   ├── index.html
│   └── js/
│       ├── api.js                    # API client
│       ├── app.js                    # Main app logic
│       ├── state.js                  # State management
│       └── ui.js                     # DOM rendering
├── config/
│   └── vendors.yaml                  # Vendor configuration
├── scripts/
│   ├── setup.js                      # Setup automation
│   ├── setup.sh                      # macOS/Linux setup
│   └── setup.bat                     # Windows setup
├── package.json                      # Dependencies & npm scripts
├── tsconfig.json                     # Base TypeScript config
├── tsconfig.server.json              # Server build config
├── tsconfig.crawler.json             # Crawler build config
├── docker-compose.yml                # Optional Docker setup
└── README.md                         # This file
```

## Data Storage

### Local Directories

- **Raw Markdown Files**: `~/Documents/RAG-Data/raw/[vendor_id]/`
- **ChromaDB Data**: `./chroma_data/` (in project root)
- **SQLite Database**: `./rag_chat.db` (in project root)

### Database Schema

- `ChatSession`: Chat conversation sessions
- `Message`: Individual messages in sessions
- `VendorCollection`: Metadata about vector collections

## LLM Configuration

### Using Ollama (Default)

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Start: `ollama serve`
3. Pull models:

   ```bash
   ollama pull mistral
   ollama pull nomic-embed-text
   ```

4. Set in `.env.local`:

   ```bash
   LLM_PROVIDER=ollama
   OLLAMA_API_URL=http://localhost:11434
   ```

### Using Microsoft Copilot

1. Get API key from OpenAI/Copilot
2. Set in `.env.local`:

   ```bash
   LLM_PROVIDER=copilot
   COPILOT_API_KEY=your_api_key
   COPILOT_ENDPOINT=https://api.openai.com/v1
   ```

## Troubleshooting

### Ollama Connection Failed

```bash
Error: Ollama is not running on localhost:11434
```

**Solution**:

```bash
ollama serve
# In another terminal:
ollama pull nomic-embed-text mistral
```

### No Collections Available

```bash
Error: Failed to fetch vendors - No vendors available
```

**Solution**:

1. Run crawler to collect documents: `npm run crawler:build && npm run crawler:run`
2. Check `~/Documents/RAG-Data/raw/` to verify files were downloaded
3. Manually ingest documents: `npm run crawler:build && node dist/cli/ingest.js all`
4. Verify ChromaDB collections: Open `http://localhost:3000` and check vendor list

### Database Reset

To reset the chat database and start fresh:

```bash
rm ./chroma_data/chat.db  # or $DATABASE_URL location
npm run db:migrate
```

### Port Already in Use

```bash
Error: Port 3000 is already in use
```

**Solution**:

```bash
# macOS/Linux: Find and kill process
lsof -i :3000
kill -9 <PID>

# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Performance Tuning

### Chunking

Adjust in `src/lib/chunking.ts`:

```typescript
const TOKEN_LIMIT = 1000;        // Smaller = more chunks, slower processing
const OVERLAP_PERCENTAGE = 0.1;  // Higher = more context, larger DB
```

### Embedding Model

Better models in `src/lib/embeddings.ts`:

```typescript
const EMBEDDING_MODEL = "nomic-embed-text";  // Lightweight
// or try "mxbai-embed-large" for better quality
```

### LLM Model

Faster models in `src/lib/query-orchestrator.ts`:

```typescript
const OLLAMA_MODEL = "mistral";    // Faster, good quality
// or try "llama2", "neural-chat", "orca-mini"
```

## Development Tips

### Debug Logging

```bash
DEBUG=true npm run crawler:run
```

### Database Inspection

```bash
npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

### Test API Endpoints

```bash
# Get vendors
curl http://localhost:3000/api/vendors

# Create session
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","vendorIds":["vendor-a"]}'
```

## Extending the System

### Adding a New Vendor

1. Edit `config/vendors.yaml` and add a new vendor entry:

   ```yaml
   - id: new-vendor
     name: New Vendor Documentation
     baseUrl: https://docs.newvendor.com
     includePatterns:
       - https://docs.newvendor.com/.*
     excludePatterns:
       - .*\.pdf$
     crawlDepth: 3
     refreshIntervalHours: 24
   ```

2. Restart the application: `npm run dev` (crawler will pick up the new vendor on next cycle)
3. Or manually trigger: `npm run crawler:build && node dist/cli/ingest.js new-vendor`

### Adding Custom Embeddings

Create `src/lib/custom-embeddings.ts`:

```typescript
export async function generateCustomEmbedding(text: string): Promise<number[]> {
  // Your embedding logic
}
```

### Custom LLM Integration

Extend `src/lib/query-orchestrator.ts`:

```typescript
async function queryWithCustomLLM(query: string, context: string): Promise<string> {
  // Your LLM integration
}
```

## Production Deployment

### Build

```bash
npm run build
```

### Environment for Production

Create `.env.production.local`:

```env
NODE_ENV=production
PORT=3000
OLLAMA_API_URL=http://localhost:11434  # or remote Ollama instance
LLM_PROVIDER=copilot  # Use managed service for reliability
COPILOT_API_KEY=your_api_key_here
COPILOT_ENDPOINT=https://api.openai.com/v1
DATABASE_URL=file:./chroma_data/chat.db
```

### For Traditional Node Hosting

Since this is an Express.js app (not Next.js), deploy to any Node.js host:

- Railway, Render, Heroku, DigitalOcean App Platform, etc.
- Build: `npm run build`
- Start: `npm start`
- Ensure Ollama is accessible from your server (local or remote)

### For Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
CMD ["npm", "start"]
```

## Security Considerations

- Keep API keys in `.env.local` (never commit)
- Validate vendor URLs before adding
- Limit crawler depth to prevent resource exhaustion
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Sanitize user input in chat interface

## License

MIT

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Submit a pull request

## Support

- **Issues**: GitHub Issues
- **Documentation**: See README.md
- **Configuration Examples**: Check `config/vendors.yaml`
- **CLI Usage**: Run `node dist/cli/ingest.js --help` or `node dist/cli/query.js --help`

## Roadmap

- [ ] Migrate UI to Next.js + React components (components already prepared)
- [ ] REST API endpoints for manual crawl & ingestion triggers
- [ ] Admin dashboard for crawler management
- [ ] Document upload support (not just web crawl)
- [ ] Advanced analytics and insights
- [ ] Multi-user support with authentication
- [ ] API key authentication for programmatic access
- [ ] Streaming responses for faster UX
- [ ] Custom prompt templates per vendor
- [ ] Citation tracking with source links
- [ ] Quality metrics and search relevance scoring

## Acknowledgments

- [Crawlee](https://crawlee.dev/) - Web scraping framework
- [ChromaDB](https://www.trychroma.com/) - Vector database
- [Ollama](https://ollama.ai/) - Local LLM runtime
- [Next.js](https://nextjs.org/) - React framework
- [Basecoat UI](https://basecoatui.com/) - Design inspiration

---

Made with ❤️ for the open-source community
