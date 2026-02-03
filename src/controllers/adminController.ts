import { AdminUserService } from "../services/adminService";
import { ResponseError } from "../utils/responseError";

export class AdminUserController {
  static async getUsers({ query }: any) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    if (page <= 0 || limit <= 0) {
      throw new ResponseError(
        400,
        "Bad Request",
        "page dan limit harus angka positif"
      );
    }

    return await AdminUserService.getUsersPagination({
      page,
      limit,
    });
  }
}
