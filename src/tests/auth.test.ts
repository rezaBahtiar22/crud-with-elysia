// mock prisma 
vi.mock("../database/prisma", async () => {
  const { prisma } = await import("../mocks/mockPrisma");
  return { prisma };
});


import { prisma } from "../database/prisma";
import { AuthService } from "../services/authUserService";
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockedPrisma = vi.mocked(prisma, true);

describe("POST /auth/register", () => {

    // reset mock tiap test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should register new user success", async () => {
        mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

        mockedPrisma.user.create.mockResolvedValueOnce({
        id: 3,
        name: "Qin Shi Huang",
        email: "test@email.com",
        password: "hashed",
        role: "USER",
        created_at: new Date(),
        updated_at: new Date(),
        tokens: null
        });

        const result = await AuthService.register({
        name: "Qin Shi Huang",
        email: "test@email.com",
        password: "Testing@#$123"
        });

        expect(result.data.email).toBe("test@email.com");
    });

    it("should throw error if email exist", async () => {
        mockedPrisma.user.findUnique.mockResolvedValueOnce({
        id: 3,
        name: "Qin Shi Huang",
        email: "test@email.com",
        password: "hashed",
        role: "USER",
        created_at: new Date(),
        updated_at: new Date(),
        tokens: null
        });

        await expect(
        AuthService.register({
            name: "Qin Shi Huang",
            email: "test@email.com",
            password: "Testing@#$123"
        })
        ).rejects.toThrow("Email is already registered");
    });
});
