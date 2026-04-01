import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../database/prisma"
import * as argon2 from "argon2"

async function SeedAdmin() {
    const hashed = await argon2.hash(process.env.ADMIN_PASSWORD!);

    const admin = await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL! },
        update: {},
        create: {
            name: "Primordial One",
            email: process.env.ADMIN_EMAIL!,
            password: hashed,
            role: Role.ADMIN
        }
    });

    console.log("Admin ready", admin.email);
};

SeedAdmin()
    .catch(console.error)
    .finally(() => prisma.$disconnect());