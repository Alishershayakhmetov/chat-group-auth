/*
import { PrismaClient } from '@prisma/client';

class PrismaService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],  // Enable logging for better debugging
    });

    // Middleware for logging query execution time
    this.prisma.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();

      console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
      return result;
    });

    // Graceful shutdown handling
    process.on('SIGTERM', this.shutdown);
    process.on('SIGINT', this.shutdown);
  }

  // Connect to the database
  async connect() {
    await this.prisma.$connect();
    console.log('Prisma client connected');
  }

  // Disconnect from the database
  async disconnect() {
    await this.prisma.$disconnect();
    console.log('Prisma client disconnected');
  }

  // Graceful shutdown function
  private shutdown = async () => {
    await this.prisma.$disconnect();
    console.log('Prisma client disconnected on shutdown');
  };

  // Get the Prisma client instance
  getClient() {
    return this.prisma;
  }
}

export const prismaService = new PrismaService();
*/
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      // take all 'undeleted' records with OVERRIDE option
      async findMany({ model, operation, args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
      async findUnique({ model, operation, args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
      async findFirst({ model, operation, args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
      async findFirstOrThrow({ model, operation, args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
      async findUniqueOrThrow({ model, operation, args, query }) {
        args.where = { deletedAt: null, ...args.where }
        return query(args)
      },
    },
  },
})