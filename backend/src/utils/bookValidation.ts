import { z } from "zod";

export class BookValidation {
    // validasi tambah buku
    static readonly createBook = z.object({
        title: z.string()
            .min(4, "Title must be at least 4 characters long")
            .max(100),
        
        author: z.string()
            .min(4, "Author must be at least 4 characters long")
            .max(100),

        isbn: z.string()
            .min(4, "ISBN must be at least 4 characters long")
            .max(100),

        // field optional
        publisher: z.string().optional(),
        year: z.preprocess((val) => (val === "" ? undefined : val), 
            z.coerce.number()
                .int()
                .min(1000)
                .max(new Date().getFullYear())
                .optional()
        ),
        category: z.string().optional(),
        description: z.string().optional(),
        readLink: z.union([
            z.string().url("Read link must be a valid URL"),
            z.literal(''),
            z.null()
        ]).optional(),
        bookFile: z.any().optional(),
        cover: z.union([
            z.string().url("Cover must be a valid URL"),
            z.literal(''),
            z.null()
        ]).optional(),

        // stock default 1 jika tidak diisi
        stock: z.coerce.number()
            .int()
            .min(1, "Stok minimal adalah 1")
            .default(1)
    })

    // validasi update buku - semua field optional
    static readonly updateBook = z.object({
        title: z.string().min(4).optional(),
        author: z.string().min(4).optional(),
        isbn: z.string().min(4).optional(),
        publisher: z.string().optional(),
        year: z.preprocess((val) => (val === "" ? undefined : val),
            z.coerce.number().int().min(1000).max(new Date().getFullYear()).optional()
        ),
        category: z.string().optional(),
        description: z.string().optional(),
        readLink: z.union([
            z.string().url("Read link must be a valid URL"),
            z.literal(''),
            z.null()
        ]).optional(),
        bookFile: z.any().optional(),
        cover: z.union([
            z.string().url("Cover must be a valid URL"),
            z.literal(''),
            z.null()
        ]).optional(),
        stock: z.coerce.number().int().min(1, "Stok minimal adalah 1").optional()
    })
}
