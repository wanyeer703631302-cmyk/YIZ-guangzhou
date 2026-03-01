/**
 * Prisma Client Singleton
 * 
 * This module provides a singleton instance of the Prisma Client with:
 * - Connection pool management
 * - Error handling
 * - Development hot-reload support
 * 
 * Validates Requirement 2.1: Database configuration migration
 */

import { PrismaClient } from '@prisma/client'

// Extend global namespace to store Prisma instance in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Prisma Client options with connection pool configuration
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] as const
    : ['error'] as const,
  
  // Connection pool settings for optimal performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

/**
 * Create a new Prisma Client instance with error handling
 */
function createPrismaClient(): PrismaClient {
  try {
    const client = new PrismaClient(prismaClientOptions)
    
    // Log successful connection in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Prisma Client initialized successfully')
    }
    
    return client
  } catch (error) {
    console.error('Failed to initialize Prisma Client:', error)
    throw new Error(
      'Database connection failed. Please check your DATABASE_URL environment variable.'
    )
  }
}

/**
 * Singleton Prisma Client instance
 * 
 * In development, we store the instance on the global object to prevent
 * creating multiple instances during hot-reload.
 * 
 * In production, we create a single instance that lives for the lifetime
 * of the application.
 */
const prisma = global.prisma || createPrismaClient()

// Store instance globally in development to survive hot-reloads
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma
}

/**
 * Test database connection
 * 
 * This function attempts to connect to the database and returns
 * a boolean indicating success or failure.
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

/**
 * Gracefully disconnect from the database
 * 
 * This should be called when shutting down the application
 * to ensure all connections are properly closed.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    console.log('✓ Database disconnected successfully')
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}

/**
 * Get database connection status
 * 
 * Returns information about the current database connection state
 */
export async function getDatabaseStatus(): Promise<{
  connected: boolean
  error?: string
}> {
  try {
    const isConnected = await testDatabaseConnection()
    return {
      connected: isConnected,
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Export the singleton instance as default
export default prisma

// Also export as named export for convenience
export { prisma }
