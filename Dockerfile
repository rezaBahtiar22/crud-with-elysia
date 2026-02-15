# Gunakan Bun official image
FROM oven/bun:1.1-alpine

WORKDIR /app

# Copy dependency files dulu
COPY package.json bun.lock ./

# Install dependency
RUN bun install --frozen-lockfile

# Copy semua file project
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Expose port (ganti kalau server yang digunakan bukan 3000)
EXPOSE 3000

# Jalankan migration + start server
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]
