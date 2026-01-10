import { describe, it, expect, beforeEach, vi } from "vitest";

// mock argon2
vi.mock("argon2", async (importOriginal) => {
    const actual = await importOriginal<typeof import("argon2")>();

    return {
        ...actual,
        hash: vi.fn(),
        verify: vi.fn(),
    }
});

// mock prisma 
vi.mock("../database/prisma", async () => {
  const { prisma } = await import("../mocks/mockPrisma");
  return { prisma };
});

import { prisma } from "../database/prisma";
import { AuthService } from "../services/authUserService";
import * as argon2 from "argon2";

const mockedPrisma = vi.mocked(prisma, true);
const mockedArgon2 = vi.mocked(argon2);

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

        mockedArgon2.hash.mockResolvedValueOnce("hashed");

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


describe("POST /auth/login", () => {
    // reset mock tiap test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should login user success", async () => {
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

        mockedArgon2.verify.mockResolvedValueOnce(true);

        const result = await AuthService.login({
            email: "test@email.com",
            password: "Testing@#$123"
        });

        expect(result.data.email).toBe("test@email.com");
        expect(result.data.token).toBeDefined();
    });

    it("should throw error if email not found", async () => {
        mockedPrisma.user.findUnique.mockResolvedValueOnce(null);

        await expect(
            AuthService.login({
                email: "nana@email.com",
                password: "Testing@#$123"
            })
        ).rejects.toThrow("Email or password is incorrect");

        expect(mockedPrisma.user.findUnique).toHaveBeenCalled();
        expect(mockedArgon2.verify).not.toHaveBeenCalled();
    });

    it("should throw error if password wrong", async () => {
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

        mockedArgon2.verify.mockResolvedValueOnce(false);

        await expect(
            AuthService.login({
                email: "test@email.com",
                password: "wrong_password"
            })
        ).rejects.toThrow("Email or password is incorrect");

        expect(mockedArgon2.verify).toHaveBeenCalled();
    });
})
