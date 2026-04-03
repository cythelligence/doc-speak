import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express, { Request, Response, Express } from 'express';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { executeQuery } from '../lib/query-orchestrator';

const app: Express = express();

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'chroma_data/chat.db')}`,
});
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Types
interface SessionRequest {
  title: string;
  vendorIds?: string[];
}

interface ChatRequest {
  message: string;
  vendorIds: string[];
}

// ============================================================
// API Routes
// ============================================================

// GET /api/sessions - Get all sessions
app.get('/api/sessions', async (_req: Request, res: Response) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        vendorIds: true,
      },
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/sessions - Create a new session
app.post('/api/sessions', async (req: Request, res: Response) => {
  try {
    const body: SessionRequest = req.body;

    const session = await prisma.chatSession.create({
      data: {
        title: body.title,
        vendorIds: JSON.stringify(body.vendorIds || []),
      },
    });

    res.json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/sessions/:sessionId/messages - Get messages for a session
app.get('/api/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const messages = await prisma.message.findMany({
      where: {
        sessionId,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/:sessionId - Send a message and get a response
app.post('/api/chat/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const { message, vendorIds } = req.body as ChatRequest;

    if (!message || !vendorIds || vendorIds.length === 0) {
      res.status(400).json({ error: 'Missing message or vendorIds' });
      return;
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'user',
        content: message,
      },
    });

    // Execute query through orchestrator
    const queryResult = await executeQuery({
      vendorIds,
      query: message,
      maxContext: 10,
    });

    // Save assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: queryResult.answer,
      },
    });

    res.json({
      userMessage,
      assistantMessage,
      sources: queryResult.sources,
      model: queryResult.model,
      provider: queryResult.provider,
    });
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// GET /api/vendors - Get available vendors
app.get('/api/vendors', async (_req: Request, res: Response) => {
  try {
    const { getAvailableVendors } = await import('../lib/query-orchestrator');
    const vendors = await getAvailableVendors();
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// ============================================================
// Serve HTML for root and all non-API routes
// ============================================================

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// SPA fallback - serve index.html for non-API routes using middleware
app.use((req: Request, res: Response) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
