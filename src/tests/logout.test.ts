import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../utils/logging", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

import { AuthService } from "../services/authUserService";
import { logger } from "../utils/logging";

describe("POST /user/logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should logout user success", async () => {
        const result = await AuthService.logout(
            { userId: "1" },
            "fake token"
        );

        expect(result.message).toBe("User logged out successfully");
    });

    it("should log logout event", async () => {
        const loggerSpy = vi.spyOn(logger, "info");

        await AuthService.logout(
            { userId: "1" },
            "fake token"
        );

        expect(loggerSpy).toHaveBeenCalledTimes(1);
        expect(loggerSpy).toHaveBeenCalledWith(
            "user logout",
            expect.objectContaining({
                userId: "1"
            })
        );
    });

    it("should throw error and log warning if user is missing", async () => {
        const warnSpy = vi.spyOn(logger, "warn");

        await expect(
            AuthService.logout(
                null as any,
                "fake token"
            )
        ).rejects.toThrow("Authentication is required");

        expect(warnSpy).toHaveBeenCalledWith(
            "Logout failed: Unauthenticated request",
        );
    });

    it("should throw error and log warning if token is missing", async () => {
        const warnSpy = vi.spyOn(logger, "warn");

        await expect(
            AuthService.logout(
                {  userId: "1" },
                null as any
            )
        ).rejects.toThrow("Authentication is required");

        expect(warnSpy).toHaveBeenCalledWith(
            "Logout failed: Unauthenticated request",
        );
    })
})