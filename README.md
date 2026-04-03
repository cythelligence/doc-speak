# Doc-Speak: Native Local Modular RAG System

A comprehensive local-first RAG (Retrieval-Augmented Generation) system built with TypeScript, Next.js, Crawlee, ChromaDB, and Ollama. All components run natively on your machine without Docker.

## Features

✨ **Features**

- 🕷️ **Native Web Crawler**: Automatic documentation crawling with Crawlee + Playwright
- 📘 **Local Vector Storage**: ChromaDB running as a persistent local client
- 🤖 **Multi-LLM Support**: Ollama (local) or Microsoft Copilot
- 🎯 **Multi-Vendor Queries**: Search across multiple documentation sources simultaneously
- 💬 **Chat Interface**: Beautiful web UI built with Next.js and Tailwind CSS
- 📊 **Chat History**: SQLite-backed conversation persistence
- ⚙️ **Configurable Scheduling**: Automatic documentation refresh via cron
- 🔧 **TypeScript Strict Mode**: Type-safe throughout

## Architecture

### Module A: Web Crawler & Scheduler
- Crawls documentation using Crawlee (Playwright-based)
- Converts HTML to Markdown format
- Saves to local filesystem: `~/Documents/RAG-Data/raw/[vendor_id]`
- Scheduled refresh cycles via node-cron

### Module B: Ingestion & Vector Storage
- Parses Markdown documents
- Chunks with 1000-token limit and 10% overlap
- Generates embeddings via local Ollama (nomic-embed-text)
- Stores in ChromaDB with unique collections per vendor

### Module C: Query Orchestrator
- Routes queries to appropriate vendor collections
- Supports single and multi-vendor searches
- Aggregates context from multiple sources
- Switches between Ollama and Copilot LLMs

### Module D: Web Interface
- Next.js App Router with Tailwind CSS
- Midnight Navy (#001529) + Vibrant Cyan (#00E5FF) design
- Multi-select vendor sidebar
- Threaded chat with history
- Responsive and beautiful UI

## Prerequisites

### Required
- **Node.js v20+** (install via [nvm](https://github.com/nvm-sh/nvm) or [direct download](https://nodejs.org/))
- **Ollama** desktop app (for local embeddings and LLM)
  - macOS: `brew install ollama` or download from [ollama.ai](https://ollama.ai)
  - Linux: Download from [ollama.ai](https://ollama.ai)
  - Windows: Download from [ollama.ai](https://ollama.ai)

### Optional
- **Docker** (for potential ChromaDB scaling, not required for basic usage)
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

### 3. Start Ollama

In a separate terminal:

```bash
ollama serve
```

This starts Ollama on `localhost:11434` with default settings.

### 4. Pull Required Models

In another terminal, ensure the embedding model is available:

```bash
ollama pull nomic-embed-text
ollama pull mistral  # or your preferred model
```

## Configuration

### Environment Variables (`.env.local`)

```env
# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434

# ChromaDB Configuration
CHROMA_DATA_PATH=./chroma_data
CHROMA_PORT=8000

# Microsoft Copilot Configuration (optional)
COPILOT_API_KEY=your_api_key_here
COPILOT_ENDPOINT=https://api.openai.com/v1

# LLM Provider: 'ollama' or 'copilot'
LLM_PROVIDER=ollama

# Crawler Configuration
RAG_DATA_PATH=~/Documents/RAG-Data
CRAWLER_USER_AGENT=Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36

# Database
DATABASE_URL=file:./rag_chat.db

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Vendor Configuration (`vendors.config.ts`)

```typescript
export const vendors: VendorConfig[] = [
  {
    id: "vendor-a",
    name: "Vendor A Documentation",
    baseUrl: "https://docs.vendor-a.com",
    includePatterns: ["https://docs.vendor-a.com/.*"],
    excludePatterns: [".*\\.pdf$", ".*search.*"],
    crawlDepth: 3,
    refreshIntervalHours: 24
  },
  // Add more vendors...
];
```

## Usage

### Development

Start all services concurrently (crawler + web app):

```bash
npm run dev
```

This:
1. Starts the web crawler (background process with scheduling)
2. Starts the Next.js development server on `http://localhost:3000`

### Individual Commands

```bash
# Web app only
npm run web:dev

# Crawler only
npm run crawler:run

# Build for production
npm run build

# Start production server
npm start

# Database management
npm run db:migrate     # Run migrations
npm run db:studio     # Open Prisma Studio
```

### Workflow

1. **Configure Vendors**: Edit `vendors.config.ts` with your documentation URLs
2. **Start Services**: Run `npm run dev`
3. **Trigger Crawl**: 
   - Automatic: Crawls run on schedule
   - Manual: API endpoint (coming soon)
4. **Ingest Documents**: 
   - Automatic: Triggered after crawl
   - Manual: Via admin dashboard (coming soon)
5. **Query Documentation**:
   - Open `http://localhost:3000`
   - Select vendors
   - Create new chat
   - Ask questions

## API Endpoints

### Sessions
- `GET /api/sessions` - List all chat sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/[sessionId]/messages` - Get messages in session

### Chat
- `POST /api/chat/[sessionId]` - Send message and get response

### Vendors
- `GET /api/vendors` - List available vendors

## Project Structure

```
doc-speak/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── api/                      # API routes
│   │   │   ├── vendors/route.ts
│   │   │   ├── sessions/route.ts
│   │   │   └── chat/[sessionId]/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/                   # React components
│   │   ├── ChatSidebar.tsx
│   │   └── ChatView.tsx
│   ├── crawler/                      # Module A: Web Crawler
│   │   ├── index.ts
│   │   ├── web-crawler.ts
│   │   ├── scheduler.ts
│   │   └── logger.ts
│   └── lib/                          # Shared utilities
│       ├── chunking.ts               # Module B: Document chunking
│       ├── embeddings.ts             # Embedding generation
│       ├── chroma.ts                 # ChromaDB client
│       ├── ingestion-pipeline.ts     # Module B: Ingestion
│       └── query-orchestrator.ts     # Module C: Query routing
├── prisma/
│   └── schema.prisma                 # Database schema
├── public/                           # Static assets
├── scripts/
│   ├── setup.js                      # Setup automation
│   ├── setup.sh                      # macOS/Linux setup
│   └── setup.bat                     # Windows setup
├── vendors.config.ts                 # Vendor configuration
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tsconfig.crawler.json             # Crawler-specific TypeScript
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS config
├── postcss.config.js                 # PostCSS config
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
   ```
   LLM_PROVIDER=ollama
   OLLAMA_API_URL=http://localhost:11434
   ```

### Using Microsoft Copilot

1. Get API key from OpenAI/Copilot
2. Set in `.env.local`:
   ```
   LLM_PROVIDER=copilot
   COPILOT_API_KEY=your_api_key
   COPILOT_ENDPOINT=https://api.openai.com/v1
   ```

## Troubleshooting

### Ollama Connection Failed
```
Error: Ollama is not running on localhost:11434
```
**Solution**: 
```bash
ollama serve
# In another terminal:
ollama pull nomic-embed-text mistral
```

### No Collections Available
```
Error: Failed to fetch vendors - No vendors available
```
**Solution**: 
1. Ensure crawlers have run: `npm run crawler:run`
2. Check `~/Documents/RAG-Data/raw/` for files
3. Manually trigger ingestion via admin dashboard (coming soon)

### Database Already Exists
```
Error: Database already initialized
```
**Solution**: 
```bash
rm rag_chat.db
npm run db:migrate
```

### Port Already in Use
```
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
1. Edit `vendors.config.ts`:
   ```typescript
   {
     id: "new-vendor",
     name: "New Vendor Docs",
     baseUrl: "https://docs.newvendor.com",
     includePatterns: ["https://docs.newvendor.com/.*"],
     excludePatterns: [],
     crawlDepth: 3,
     refreshIntervalHours: 24
   }
   ```
2. Restart crawler: `npm run dev`

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
NEXT_PUBLIC_API_URL=https://your-domain.com
LLM_PROVIDER=copilot  # Use managed service in production
```

### For Vercel
```bash
vercel deploy
```

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
- **Examples**: Check `vendors.config.ts`

## Roadmap

- [ ] Admin dashboard for crawler management
- [ ] Document upload support (not just web crawl)
- [ ] Advanced analytics
- [ ] Multi-user support
- [ ] API key authentication
- [ ] Streaming responses
- [ ] Custom prompt templates
- [ ] Citation tracking
- [ ] Quality metrics

## Acknowledgments

- [Crawlee](https://crawlee.dev/) - Web scraping framework
- [ChromaDB](https://www.trychroma.com/) - Vector database
- [Ollama](https://ollama.ai/) - Local LLM runtime
- [Next.js](https://nextjs.org/) - React framework
- [Basecoat UI](https://basecoatui.com/) - Design inspiration

---

Made with ❤️ for the open-source community
