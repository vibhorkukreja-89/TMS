import * as userRepo from "@/repositories/user.repository";
import type { User } from "@/generated/prisma/client";

export async function getUsers(): Promise<User[]> {
  return userRepo.findAllUsers();
}
