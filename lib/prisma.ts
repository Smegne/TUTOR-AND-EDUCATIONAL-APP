// lib/prisma.ts
import pkg from '@prisma/client'

const PrismaClient = (pkg as any).PrismaClient ?? (pkg as any).default ?? pkg

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma