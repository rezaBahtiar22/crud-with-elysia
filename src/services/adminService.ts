import { prisma } from "../database/prisma";
import type { UserPaginationQuery } from "../interfaces/userPagination";
import type{ AdminDeleteUsersResponse } from "../interfaces/authAdmin";
import { ResponseError } from "../utils/responseError";

export class AdminUserService {
  static async getUsersPagination(query: UserPaginationQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const skip = (page - 1) * limit;

    // total user count
    const totalItems = await prisma.user.count({
      where: {
        deletedAt: null
      }
    });

    // data pagination
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null
      },
      skip,
      take: limit,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: users,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  static async deleteUser(
    currentUser: { id: number, role: string },
    targetUserId: number
  ): Promise <AdminDeleteUsersResponse> {

    // cek jika user bukan admin
    if (currentUser.role !== "ADMIN") {
      throw new ResponseError(
        403,
        "Forbidden",
        "User not allowed"
      );
    }

    // cek jika user tidak dapat menghapus dirinya sendiri
    if (currentUser.id === targetUserId) {
      throw new ResponseError(
        400,
        "Bad Request",
        "Cannot delete yourself"
      );
    }

    // cek user ada atau tidak
    const user = await prisma.user.findFirst({
      where: { 
        id: targetUserId,
        deletedAt: null
      }
    });

    // cek jika user tidak ditemukan
    if (!user) {
      throw new ResponseError(
        404,
        "Not Found",
        "User not found"
      );
    }

    // hapus user
    await prisma.user.update({
      where: { id: targetUserId },
      data: { deletedAt: new Date() }
    });

    await prisma.refreshToken.deleteMany({
      where: { userId: targetUserId }
    })

    return {
      message: "User deleted successfully",
      deletedUserId: targetUserId
    }
  }
}
