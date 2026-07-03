import prisma from "./prisma";

export async function isFirstUser(): Promise<boolean> {
  const count = await prisma.user.count();
  return count === 0;
}

export async function createFirstUser(data: {
  username: string;
  name: string;
  password: string;
}) {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      username: data.username,
      name: data.name,
      passwordHash,
      role: "PARENT",
    },
  });
}
