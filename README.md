![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![ElysiaJS](https://img.shields.io/badge/ElysiaJS-%23212121.svg?style=for-the-badge&logo=elysia&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
# crud-with-elysia

## Deskripsi
Ini adalah proyek CRUD sederhana menggunakan Elysia dan Bun. Proyek ini dibuat untuk belajar dasar-dasar backend dengan TypeScript, autentikasi, dan database.

## Tech Stack
- Bun (runtime JavaScript/TypeScript)
- Elysia (web framework)
- TypeScript
- Prisma (ORM)
- PostgreSQL (database)
- JWT (JSON Web Token untuk autentikasi)

## Auth Flow Sederhana
1. **Register User**: Membuat user baru dengan email dan password.
2. **Login User**: User login dengan email dan password, mendapatkan JWT.
3. **Logout User**: Menghapus token dari sisi client (stateless).
4. **Update User**: User dapat mengubah data dirinya (misal: nama, password).

## Cara Install
```bash
bun install
```

## Cara Menjalankan
```bash
bun run index.ts
```

## Lainnya
- Semua endpoint CRUD dan autentikasi menggunakan Elysia.
- Prisma digunakan untuk menghubungkan aplikasi ke database PostgreSQL.
- JWT digunakan untuk mengamankan endpoint yang membutuhkan autentikasi.
- Proyek ini masih sangat dasar dan hanya untuk latihan.

---
Proyek dibuat dengan `bun init` pada Bun v1.2.16. [Bun](https://bun.sh) adalah runtime JavaScript/TypeScript yang cepat dan modern.
