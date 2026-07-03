import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { credentialsProvider } from "./auth.providers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [credentialsProvider],
});
