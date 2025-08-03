import { id } from "zod/v4/locales";
import { PrismaClient } from "./lib/generated/prisma";
const p = new PrismaClient();

p.user.create
