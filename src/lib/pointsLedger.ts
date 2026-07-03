import prisma from "./prisma";

export async function awardPoints(
  studentId: number,
  points: number,
  reason: string
): Promise<void> {
  if (points <= 0) throw new Error("积分必须为正数");

  await prisma.user.update({
    where: { id: studentId },
    data: { points: { increment: points } },
  });
}

export async function deductPoints(
  studentId: number,
  points: number,
  reason: string
): Promise<boolean> {
  if (points <= 0) throw new Error("积分必须为正数");

  const user = await prisma.user.findUnique({
    where: { id: studentId },
    select: { points: true },
  });

  if (!user || user.points < points) {
    return false; // 余额不足
  }

  await prisma.user.update({
    where: { id: studentId },
    data: { points: { decrement: points } },
  });

  return true;
}

export async function refundPoints(
  studentId: number,
  points: number
): Promise<void> {
  if (points <= 0) throw new Error("积分必须为正数");

  await prisma.user.update({
    where: { id: studentId },
    data: { points: { increment: points } },
  });
}

export async function getPointsBalance(studentId: number): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: studentId },
    select: { points: true },
  });
  return user?.points ?? 0;
}
