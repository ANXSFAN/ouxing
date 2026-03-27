import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
  }
}
