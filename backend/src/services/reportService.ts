import { prisma } from "../database/prisma";
import ExcelJS from "exceljs";
import { ResponseError } from "../utils/responseError";

export class ReportService {
  /**
   * Export Riwayat Peminjaman ke Excel
   * @param userId optional, jika ada maka hanya export milik user tsb
   */
  static async exportBorrowingToExcel(userId?: number) {
    // Ambil data peminjaman
    const borrowings = await prisma.borrowing.findMany({
      where: {
        ...(userId && { userId: userId }),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        book: {
          select: { title: true, isbn: true },
        },
      },
      orderBy: {
        borrowedAt: "desc",
      },
    });

    if (borrowings.length === 0) {
      throw new ResponseError(404, "Data_Not_Found", "Tidak ada data peminjaman untuk diekspor");
    }

    // Buat Workbook & Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Peminjaman");

    // Definisi Kolom
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Anggota", key: "nama", width: 25 },
      { header: "Judul Buku", key: "buku", width: 35 },
      { header: "ISBN", key: "isbn", width: 20 },
      { header: "Tanggal Pinjam", key: "tgl_pinjam", width: 18 },
      { header: "Jatuh Tempo", key: "tgl_deadline", width: 18 },
      { header: "Tanggal Kembali", key: "tgl_kembali", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Denda (Rp)", key: "denda", width: 15 },
    ];

    // Styling Header
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "6366F1" }, // Warna ungu premium
    };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // Masukkan Data
    borrowings.forEach((b, index) => {
      worksheet.addRow({
        no: index + 1,
        nama: b.user.name,
        buku: b.book.title,
        isbn: b.book.isbn,
        tgl_pinjam: b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString("id-ID") : "-",
        tgl_deadline: b.dueDate ? new Date(b.dueDate).toLocaleDateString("id-ID") : "-",
        tgl_kembali: b.returnedAt ? new Date(b.returnedAt).toLocaleDateString("id-ID") : "-",
        status: b.status,
        denda: b.fine || 0,
      });
    });

    // Formatting angka denda
    worksheet.getColumn("denda").numFmt = '#,##0';

    // Alignment data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: "middle" };
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
