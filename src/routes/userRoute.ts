import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/authController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import type { AuthUserUpdatePasswordRequest } from "../interfaces/authUserUpdatePassword";
import type { AuthContext } from "../@types/context";


export const UserRoute = new Elysia({ prefix: "/user" })

  .post(
    "/logout",
    async (ctx) => {
      return AuthController.logout(ctx.body);
    },
    {
      detail: {
        tags: ["User Logout"],
        summary: "Logout authenticated user"
      },
      body: t.Object({
        refreshToken: t.String()
      })
    }
  )

  .patch(
    "/update/profile",
    (ctx: AuthContext) => {
      return AuthController.updateProfile(ctx.user, ctx.body);
    },
    {
      beforeHandle: AuthMiddleware,
      tags: ["User Update Profile"],
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String())
      })
    }
  )

  .patch(
    "/update/password",
    (ctx: AuthContext) => {
      return AuthController.updatePassword(
        ctx.user,
        ctx.body as AuthUserUpdatePasswordRequest
      );
    },
    {
      beforeHandle: AuthMiddleware,
      tags: ["User Update Password"],
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String(),
        confirmNewPassword: t.String()
      })
    }
  )

  .get(
    "/profile",
    (ctx: AuthContext) => {
      ctx.set.status = 200;
      return AuthController.profile(ctx.user);
    },
    {
      beforeHandle: AuthMiddleware,
      detail: {
        tags: ["User Profile"],
        summary: "Get authenticated user profile",
        security: [{ bearerAuth: [] }]
      }
    }
  );
    