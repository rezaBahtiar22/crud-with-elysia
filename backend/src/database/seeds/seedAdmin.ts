import { Role } from "../../../backend/generated/prisma/enums";
import { prisma } from "../../database/prisma"
import * as argon2 from "argon2"

async function SeedAdmin() {
    const hashed = await argon2.hash("Admin2277!@#$");

    const admin = await prisma.user.upsert({
        where: { email: "admin@gmail.com" },
        update: {},
        create: {
            name: "Primordial One",
            email: "admin@gmail.com",
            password: hashed,
            role: Role.ADMIN
        }
    });

    console.log("Admin ready", admin.email);
};

SeedAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());