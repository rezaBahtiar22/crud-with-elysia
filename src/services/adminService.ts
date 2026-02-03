import { prisma } from "../database/prisma";
import type { UserPaginationQuery } from "../interfaces/userPagination";

export class AdminUserService {
  static async getUsersPagination(query: UserPaginationQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const skip = (page - 1) * limit;

    // total user count
    const totalItems = await prisma.user.count();

    // data pagination
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: {
        created_at: "asc",
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
}
