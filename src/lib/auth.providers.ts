import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { validateCaptcha } from "./captcha";

export const credentialsProvider = Credentials({
  name: "credentials",
  credentials: {
    username: { label: "用户名", type: "text" },
    password: { label: "密码", type: "password" },
    captchaInput: { label: "验证码", type: "text" },
    captchaSession: { label: "验证码会话", type: "text" },
  },
  async authorize(credentials) {
    if (!credentials?.username || !credentials?.password) return null;

    if (credentials.captchaSession && credentials.captchaInput) {
      if (!validateCaptcha(
        credentials.captchaSession as string,
        credentials.captchaInput as string
      )) {
        return null;
      }
    }

    const user = await prisma.user.findUnique({
      where: { username: credentials.username as string },
    });

    if (!user) return null;

    const isValid = await bcrypt.compare(
      credentials.password as string,
      user.passwordHash
    );

    if (!isValid) return null;

    return {
      id: user.id.toString(),
      name: user.name,
      email: "",
      role: user.role,
      username: user.username,
    } as any;
  },
});
