import { AdminUserService } from "../services/adminService";
import { ResponseError } from "../utils/responseError";
import type { AuthContext } from "../@types/context";

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

  static async deleteUser(
    { params, user }: AuthContext
  ) {
    const id = Number(params.id);
    return AdminUserService.deleteUser(user, id);
  }
}
