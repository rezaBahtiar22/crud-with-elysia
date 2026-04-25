import { ReportService } from "../services/reportService";

export class ReportController {
  // Handler untuk Export Admin (Semua Data)
  static async exportAllBorrowings(set: any) {
    try {
      const buffer = await ReportService.exportBorrowingToExcel();
      
      // Set Header agar didownload sebagai file Excel
      set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      set.headers['Content-Disposition'] = 'attachment; filename=Laporan_Peminjaman_Global.xlsx';
      
      return buffer;
    } catch (error: any) {
      throw error;
    }
  }

  // Handler untuk Export User (Data Pribadi)
  static async exportUserBorrowings(userId: number, set: any) {
    try {
      const buffer = await ReportService.exportBorrowingToExcel(userId);
      
      set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      set.headers['Content-Disposition'] = 'attachment; filename=Riwayat_Bacaan_Saya.xlsx';
      
      return buffer;
    } catch (error: any) {
      throw error;
    }
  }
}
