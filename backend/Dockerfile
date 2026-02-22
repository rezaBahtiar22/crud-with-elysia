# Gunakan Node yang compatible dengan Prisma
FROM node:20.19-alpine

# Install Bun
RUN npm install -g bun

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependency via Bun
RUN bun install --frozen-lockfile

# Copy seluruh project
COPY . .

# Generate Prisma client
RUN bunx prisma generate

EXPOSE 3000

# Run migration + start
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]