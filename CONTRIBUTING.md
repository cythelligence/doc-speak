# Contributing to Doc-Speak

Thank you for your interest in contributing to Doc-Speak! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others and ask for help when needed

## Getting Started

### Prerequisites
- Node.js v20+
- Git
- Ollama (for local development)

### Setup for Development

```bash
# Clone the repository
git clone https://github.com/yourusername/doc-speak.git
cd doc-speak

# Run setup
./setup.sh  # macOS/Linux
# or
setup.bat   # Windows

# Start development
npm run dev
```

## Project Structure

```
src/
  app/          - Next.js pages and API routes
  components/   - React components
  crawler/      - Web crawling logic
  lib/          - Shared utilities and core logic
  cli/          - Command-line tools
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Write clean, typed TypeScript code
- Follow existing code style
- Add comments for complex logic
- Keep components small and focused

### 3. Commit Messages

Use clear, descriptive commit messages:

```
feat: Add streaming responses to chat API
fix: Resolve ChromaDB connection timeout
docs: Update API documentation
refactor: Simplify query orchestrator
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:
- Clear title describing the change
- Description of what and why
- Related issue numbers (e.g., "Fixes #123")
- Screenshots for UI changes

## Code Standards

### TypeScript

- Use `strict: true` in tsconfig
- Type all function parameters and returns
- Avoid `any` types - use generics or `unknown`
- Use descriptive variable names

```typescript
// Good
function processQuery(query: string, vendors: string[]): Promise<QueryResult> {
  // implementation
}

// Avoid
function process(q: any, v: any): any {
  // implementation
}
```

### React Components

- Use functional components with hooks
- Use TypeScript interfaces for props
- Keep components small (< 200 lines)
- Memoize expensive computations with `useMemo`

```typescript
interface ChatViewProps {
  sessionId: string | null;
  vendors: string[];
}

export default function ChatView({ sessionId, vendors }: ChatViewProps) {
  // component logic
}
```

### Error Handling

- Use try-catch for async operations
- Log errors with context
- Return meaningful error messages to users

```typescript
try {
  const result = await queryChromaDB(query);
  return result;
} catch (error) {
  logger.error("ChromaDB query failed", error);
  throw new Error("Failed to search documentation");
}
```

## Testing

### Manual Testing

```bash
# Test individual modules
make ingest-vendor VENDOR=vendor-a
make query QUERY="Your question" VENDORS="vendor-a"

# Test in browser
npm run dev
# Open http://localhost:3000
```

### Automated Testing (Future)

```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Documentation

- Update README.md for user-facing changes
- Update API.md for endpoint changes
- Add JSDoc comments for exported functions
- Include examples in commit messages

## Performance Considerations

When contributing, consider:

- **Chunking**: Large documents should be split efficiently
- **Embeddings**: Batch generation for performance
- **Database**: Index frequently queried fields
- **UI**: Avoid blocking renders with async operations
- **Memory**: Clean up resources in cleanup functions

Example optimization:
```typescript
// Good: Batch embeddings
const embeddings = await generateEmbeddings(texts);

// Avoid: Individual requests
for (const text of texts) {
  const embedding = await generateEmbedding(text);
}
```

## Testing Locally

### Test ChromaDB Integration

```typescript
import { initializeChromaDB, createVendorCollection } from "@/lib/chroma";

async function testChroma() {
  await initializeChromaDB();
  await createVendorCollection("test-vendor");
  console.log("✅ ChromaDB working");
}
```

### Test Ollama Integration

```typescript
import { checkOllamaConnection, generateEmbedding } from "@/lib/embeddings";

async function testOllama() {
  const connected = await checkOllamaConnection();
  if (!connected) throw new Error("Ollama not running");
  
  const embedding = await generateEmbedding("test");
  console.log("✅ Ollama working, embedding length:", embedding.length);
}
```

## Common Tasks

### Adding a New API Endpoint

1. Create route file: `src/app/api/[resource]/route.ts`
2. Implement GET/POST handlers
3. Add error handling
4. Update API.md documentation
5. Test with curl or Postman

### Adding a New Component

1. Create file: `src/components/YourComponent.tsx`
2. Define TypeScript interface for props
3. Use Tailwind CSS for styling
4. Export as default export
5. Document prop types

### Updating Vendor Configuration

1. Edit `vendors.config.ts`
2. Add new vendor with correct URLs
3. Test crawling: `npm run crawler:run`
4. Test ingestion: `npm run dev`
5. Verify in UI

### Extending ChromaDB

1. Update schema in `prisma/schema.prisma`
2. Create migration: `npm run db:migrate`
3. Update queries in relevant files
4. Test data persistence

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows TypeScript strict mode
- [ ] No console errors or warnings
- [ ] Comments explain complex logic
- [ ] Error messages are user-friendly
- [ ] No hardcoded values (use config/env)
- [ ] Tested locally and works
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is minimal

## Areas for Contribution

### High Priority
- [ ] Streaming chat responses
- [ ] Authentication system
- [ ] Admin dashboard for crawler management
- [ ] Unit and integration tests
- [ ] Docker deployment guide

### Medium Priority
- [ ] Document upload (not just web crawl)
- [ ] Citation tracking
- [ ] Advanced analytics
- [ ] Custom prompt templates
- [ ] Multi-user support

### Nice to Have
- [ ] VS Code extension
- [ ] CLI improvements
- [ ] Mobile app
- [ ] Dark mode UI
- [ ] Internationalization

## Getting Help

- **Questions**: Open an issue with `[question]` in title
- **Bug Report**: Use Bug Report template
- **Feature Request**: Use Feature Request template
- **Discussions**: Use GitHub Discussions tab

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Ollama Documentation](https://github.com/ollama/ollama)

## License

By contributing to Doc-Speak, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions help make Doc-Speak better for everyone. Thank you for being part of this community! 🎉
