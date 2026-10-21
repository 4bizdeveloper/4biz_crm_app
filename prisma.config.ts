import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Use DIRECT_URL for the Prisma CLI to bypass PgBouncer during introspection and migrations
    url: process.env.DIRECT_URL!, 
  },
})