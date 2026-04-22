import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '../../generated/prisma'
import { logger } from "../utils/logging";
import pg from "pg";

const connectionString = `${process.env.DATABASE_URL}`

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "info" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
        ]
        : [{ emit: "event", level: "error" }]
});

prisma.$on("query", (e) => {
   logger.info(e);
});

prisma.$on("error", (e) => {
   logger.error(e);
});

prisma.$on("warn", (e) => {
   logger.warn(e);
});

prisma.$on("info", (e) => {
   logger.info(e);
});

export { prisma }
