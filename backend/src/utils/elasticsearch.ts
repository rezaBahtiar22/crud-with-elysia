import { Client } from '@elastic/elasticsearch';

// Inisialisasi client Elasticsearch
// URL diarahkan ke service 'elasticsearch' di docker-compose (atau localhost jika jalan di luar docker)
export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

/**
 * Fungsi pembantu untuk inisialisasi Index Buku jika belum ada
 */
export const initEsIndex = async () => {
  try {
    const indexName = 'books';
    const exists = await esClient.indices.exists({ index: indexName });

    if (!exists) {
      await esClient.indices.create({
        index: indexName,
        mappings: {
          properties: {
            id: { type: 'integer' },
            title: { type: 'text', analyzer: 'standard' },
            author: { type: 'text', analyzer: 'standard' },
            isbn: { type: 'keyword' },
            publisher: { type: 'text' },
            category: { type: 'keyword' },
            description: { type: 'text' },
            created_at: { type: 'date' },
          },
        },
      });
      console.log(`Index '${indexName}' berhasil dibuat di Elasticsearch.`);
    }
  } catch (error) {
    console.error('Gagal inisialisasi index Elasticsearch:', error);
  }
};
