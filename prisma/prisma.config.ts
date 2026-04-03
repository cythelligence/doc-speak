import path from 'path';

export const datasourceUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'chroma_data/chat.db')}`;
