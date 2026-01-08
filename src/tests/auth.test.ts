import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// mock prisma 
vi.mock("../database/prisma", () => {
    return {
        prisma: {
            user: {
                findUnique: vi.fn(),
                create: vi.fn(),
            }
        }
    }
});

import { prisma } from "../mocks/mockPrisma";
import { AuthService } from "../services/authUserService";

describe("POST /auth/register", () => {
    // reset mock sebelum setiap test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // test register user sukses
    it("should register n new user success", async () => {
        prisma.user.findUnique.mockResolvedValue(null);

        prisma.user.create.mockResolvedValue({
            id: 3,
            name: "Qin Shi Huang",
            email: "test@email.com",
            password: "Testing@#$123",
            role: "USER",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const result = await AuthService.register({
            name: "Qin Shi Huang",
            email: "test@email.com",
            password: "Testing@#$123"
        });

        expect(result.data.email).toBe("test@email.com");
    });

    // test register user gagal karena email sudah terdaftar
    it("should throw error if email exist", async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 3,
            name: "Qin Shi Huang",
            email: "test@email.com",
            password: "Testing@#$123",
            role: "USER",
            createdAt: new Date(),
            updatedAt: new Date()
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