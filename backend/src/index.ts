import app from "./server.ts";
import { prisma } from "./database/prisma.ts";
import { initEsIndex } from "./utils/elasticsearch.ts";

const port = Number(process.env.PORT) || 3000;

// Inisialisasi Elasticsearch
await initEsIndex();

app.listen({ port });

console.log(
    `🚀 Server running at ${app.server?.hostname}:${app.server?.port}`
);

// Graceful shutdown
const handleShutdown = async () => {
    console.log("\n👋 Shutting down gracefully...");
    await app.stop();
    await prisma.$disconnect();
    process.exit(0);
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
