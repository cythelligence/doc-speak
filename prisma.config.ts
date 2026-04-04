export default {
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./chroma_data/chat.db',
  }
}