import { Elysia, t } from "elysia";
import { AuthController } from "../controllers/authController";
import { AuthMiddleware } from "../middlewares/authMiddleware";
import { ResponseError } from "../utils/responseError";
import type { AuthUserUpdatePasswordRequest } from "../interfaces/authUserUpdatePassword";
import type { AuthContext } from "../@types/context";

// route untuk user
// export const UserRoute = new Elysia({ prefix: "/user" })
//     .use(AuthMiddleware)
//     // logout user
//     .post("/logout", ({  user, token }) => {
//         if ( !user || !token) {
//             throw new ResponseError(
//                 401,
//                 "Unauthorized",
//                 "Authentication is required"
//             )
//         }
//         return AuthController.logout(user, token);
//     }, {
//         detail: {
//             tags: ["User Logout"],
//             summary: "Logout authenticated user",
//             security: [{ bearerAuth: [] }]
//         }
//     })

//     // update user profile(username dan email)
//     .patch("/update/profile", async ({ body, user }) => {
//         // guard untuk cek jika user tidak ditemukan
//         if (!user) {
//             throw new ResponseError(
//                 401,
//                 "Unauthorized",
//                 "Authentication is required"
//             )
//         }

//         // guard untuk cek jika body tidak ditemukan
//         if (!body) {
//             throw new ResponseError(
//                 400,
//                 "Bad Request",
//                 "Request body is required"
//             )
//         }
//         return AuthController.updateProfile(user, body);
//     }, {
//         tags: ["User Update Profile"],
//         summary: "Update user profile (name and email)",
//         security: [{ bearerAuth: [] }],
//         body: t.Object({
//             name: t.Optional(t.String()),
//             email: t.Optional(t.String())
//         })
//     })

//     // untuk user update password
//     .patch("/update/password", ({ body, user }) => {
//         if (!user) {
//             throw new ResponseError(
//                 401,
//                 "Unauthorized",
//                 "Authentication is required"
//             )
//         }

//         return AuthController.updatePassword(
//             user,
//             body as AuthUserUpdatePasswordRequest
//         )
//     }, {
//         tags: ["User Update Password"],
//         summary: "Update user password",
//         security: [{ bearerAuth: [] }],
//         body: t.Object({
//             currentPassword: t.String(),
//             newPassword: t.String(),
//             confirmNewPassword: t.String()
//         })
//     })

//     // get profile / auth me
//     .get("/profile", ({ user, set }) => {
//         if (!user) {
//             throw new ResponseError(
//                 401,
//                 "Unauthorized",
//                 "Authentication is required"
//             )
//         }
//         set.status = 200;
//         return AuthController.profile(user);
//     }, {
//         detail: {
//             tags: ["User Profile"],
//             summary: "Get authenticated user profile",
//             security: [{ bearerAuth: [] }]
//         }
//     })

export const UserRoute = new Elysia({ prefix: "/user" })

  .post(
    "/logout",
    (ctx: AuthContext) => {
      return AuthController.logout(ctx.user, ctx.token);
    },
    {
      beforeHandle: AuthMiddleware,
      detail: {
        tags: ["User Logout"],
        summary: "Logout authenticated user",
        security: [{ bearerAuth: [] }]
      }
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
    