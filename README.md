![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![ElysiaJS](https://img.shields.io/badge/ElysiaJS-%23212121.svg?style=for-the-badge&logo=elysia&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
# crud-with-elysia

## Deskripsi
Ini adalah project Backend REST API sederhana menggunakan **Bun**, **Elysia**, dan **Prisma**.

Project ini dibuat sebagai latihan backend modern dengan arsitektur production-ready dasar:
- JWT Authentication + Refresh Token
- OTP Register & Login
- Role-based Authorization
- Admin management
- Docker & Docker Compose
- Health Check endpoint

---

## Tech Stack
- Bun (runtime JavaScript/TypeScript)
- Elysia (web framework)
- TypeScript
- Prisma (ORM)
- PostgreSQL (database)
- JWT (JSON Web Token untuk autentikasi)
- Docker & Docker Compose
- Swagger (API DOcumentation)

---

## Auth
1. **Register User**
2. **Login User**
3. **Logout User**
4. **OTP Register** 
5. **OTP Login**
6. **Verify OTP**
7. **Forgot Password**

## User
1. **Get Profile**
2. **Update Profile**
3. **Update Password**

## Admin(Role: ADMIN)
1. **Get All Users (Pagination)**
2. **Get User by ID**
3. **Soft Delete User**

## System
1. **Health Check `/health`**
2. **Root Endpoint `/`**
3. **Swagger Documentation**

## API Documentation
Swagger tersedia di: http://localhost:3000/swagger

---

## Menjalankan dengan Docker (Recommended)

## 1. Build & Run
```bash
docker compose up --build
```
Aplikasi akan berjalan di: http://localhost:3000

## 2. Seed Admin
Untuk membuat akun admin
```bash
docker compose exec backend bun run seed:admin
```

---

## Menjalankan tanpa Docker (Development)

## Cara Install
```bash
bun install
```

## Cara Menjalankan
```bash
bun run dev
bun run index.ts
```

---

## Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/db_crud_with_elysia
JWT_SECRET=your_secret
RESEND_API_KEY=your_key
MAIL_FROM=your_email

## Lainnya
- Semua endpoint CRUD dan autentikasi menggunakan Elysia.
- Prisma digunakan untuk menghubungkan aplikasi ke database PostgreSQL.
- JWT digunakan untuk mengamankan endpoint yang membutuhkan autentikasi.
- Proyek ini masih sangat dasar dan hanya untuk latihan.

---
Proyek dibuat dengan `bun init` pada Bun v1.2.16. [Bun](https://bun.sh) adalah runtime JavaScript/TypeScript yang cepat dan modern.
