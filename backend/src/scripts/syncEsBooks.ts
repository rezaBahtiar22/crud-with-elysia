import { prisma } from "../database/prisma";
import { esClient, initEsIndex } from "../utils/elasticsearch";

/**
 * Script untuk sinkronisasi semua buku dari DB ke Elasticsearch
 */
const syncBooks = async () => {
  console.log("🚀 Memulai sinkronisasi buku ke Elasticsearch...");
  
  // Pastikan index ada
  await initEsIndex();

  try {
    // Ambil semua buku yang tidak dihapus
    const books = await prisma.book.findMany({
      where: { deletedAt: null }
    });

    console.log(`📦 Ditemukan ${books.length} buku untuk disinkronkan.`);

    // Indexing massal (Bulk API lebih efisien jika data banyak)
    const operations = books.flatMap(book => [
      { index: { _index: 'books', _id: book.id.toString() } },
      {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        publisher: book.publisher,
        category: book.category,
        description: book.description,
        created_at: book.created_at
      }
    ]);

    if (operations.length > 0) {
      const bulkResponse = await esClient.bulk({ refresh: true, operations });
      if (bulkResponse.errors) {
        console.error("❌ Terjadi error saat bulk indexing.");
      } else {
        console.log(`✅ Berhasil mensinkronkan ${books.length} buku.`);
      }
    } else {
      console.log("ℹ️ Tidak ada buku untuk disinkronkan.");
    }

  } catch (error) {
    console.error("❌ Gagal sinkronisasi:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

syncBooks();
