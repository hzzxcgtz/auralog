"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/shared/PageTransition";
import { BookOpen, Eye, EyeOff, RefreshCw } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaSession, setCaptchaSession] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = async () => {
    try {
      const res = await fetch("/api/auth/captcha");
      const svg = await res.text();
      const session = res.headers.get("x-captcha-session") || "";
      setCaptchaSvg(svg);
      setCaptchaSession(session);
    } catch {
      setError("验证码加载失败，请刷新页面");
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!captchaInput) {
      setError("请输入验证码");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      username, password, captchaInput, captchaSession,
      redirect: false,
    });

    if (result?.error) {
      setError("用户名、密码或验证码错误");
      setLoading(false);
      fetchCaptcha();
      setCaptchaInput("");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">用户名</label>
        <Input value={username} onChange={e => setUsername(e.target.value)}
          placeholder="请输入用户名"
          className="border-border-warm bg-bg-warm/30 focus-visible:ring-caramel/30 h-10" required />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">密码</label>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} value={password}
            onChange={e => setPassword(e.target.value)} placeholder="请输入密码"
            className="border-border-warm bg-bg-warm/30 pr-10 focus-visible:ring-caramel/30 h-10" required />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-caramel transition-colors">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">验证码</label>
        <div className="flex gap-3">
          <Input value={captchaInput} onChange={e => setCaptchaInput(e.target.value)}
            placeholder="输入验证码"
            className="border-border-warm bg-bg-warm/30 flex-1 focus-visible:ring-caramel/30 h-10" maxLength={4} required />
          <button type="button" onClick={fetchCaptcha}
            className="flex-shrink-0 border border-border-warm rounded-lg overflow-hidden hover:border-caramel transition-colors relative group cursor-pointer"
            dangerouslySetInnerHTML={{ __html: captchaSvg }} />
        </div>
        <p className="text-[10px] text-text-light flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          <span>点击验证码图片可刷新</span>
        </p>
      </div>

      <Button type="submit" disabled={loading}
        className="w-full bg-caramel hover:bg-amber-700 text-white font-medium transition-all duration-200 active:scale-[0.98] h-10">
        {loading ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-bg-warm via-card-cream to-bg-warm relative overflow-hidden">
      {/* 纸张纹理 */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {/* 装饰光晕 */}
      <div className="fixed -top-40 -right-40 w-80 h-80 bg-caramel/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-sage/5 rounded-full blur-3xl pointer-events-none" />

      <PageTransition>
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          {/* 卡片 */}
          <div className="bg-card-cream border border-border-warm rounded-xl shadow-lg overflow-hidden">
            {/* 顶部色条 */}
            <div className="h-1 bg-gradient-to-r from-caramel via-amber-500 to-caramel/60" />

            <div className="p-6 md:p-8">
              {/* 品牌 Logo */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center text-white shadow-md mx-auto mb-4">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold text-coffee font-serif tracking-wide">纸间流光</h1>
                <p className="text-xs text-text-light mt-1">AuraLog — 记录光阴，见证成长。</p>
              </div>

              <Suspense fallback={
                <div className="text-center py-6">
                  <div className="w-8 h-8 border-2 border-caramel/30 border-t-caramel rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-text-secondary">加载中...</span>
                </div>
              }>
                <LoginForm />
              </Suspense>
            </div>
          </div>

          {/* 底部版权 */}
          <p className="text-center text-[10px] text-text-light mt-4">
            用心陪伴，静待花开 🌱
          </p>
        </div>
      </PageTransition>
    </div>
  );
}
