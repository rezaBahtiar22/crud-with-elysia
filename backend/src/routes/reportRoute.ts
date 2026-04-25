import { Elysia } from "elysia";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { RoleMiddleware } from "../middlewares/roleMiddleware";
import { ReportController } from "../controllers/reportController";

export const ReportRoute = new Elysia({ prefix: "/reports" })
  // Ekspor Admin (Semua data peminjaman)
  .get("/admin/borrowings", ({ set }) => ReportController.exportAllBorrowings(set), {
    beforeHandle: [AuthMiddleware, RoleMiddleware(["ADMIN"] as any)],
  })
  
  // Ekspor User (Data pribadi saja)
  .get("/user/borrowings", (ctx: any) => ReportController.exportUserBorrowings(ctx.user.id, ctx.set), {
    beforeHandle: [AuthMiddleware],
  });
