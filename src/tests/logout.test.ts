import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../utils/logging", () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

import { logger } from "../utils/logging";
import { AuthService } from "../services/authUserService";

describe("POST /user/logout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should logout user success", async () => {
        const result = await AuthService.logout(
            "fake token"
        );

        expect(result.message).toBe("User logged out successfully");
    });

    it("should throw error and log warning if user is missing", async () => {
        await expect(
            AuthService.logout(
                "fake token"
            )
        ).rejects.toThrow("Authentication is required");

        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining("Logout failed: Unauthenticated request")
        );
    });

    it("should throw error and log warning if token is missing", async () => {
        await expect(
            AuthService.logout(
                null as any
            )
        ).rejects.toThrow("Authentication is required");

        expect(logger.warn).toHaveBeenCalledWith(
            "Logout failed: Unauthenticated request",
        );
    })
});