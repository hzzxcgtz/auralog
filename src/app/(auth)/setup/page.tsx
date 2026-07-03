"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, Loader2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [form, setForm] = useState({ username: "", name: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((res) => res.json())
      .then((data) => {
        setNeedsSetup(data.needsSetup);
        setChecking(false);
        if (!data.needsSetup) {
          router.push("/login");
        }
      })
      .catch(() => {
        setChecking(false);
        setError("无法连接服务器");
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      setError("用户名仅支持字母、数字和下划线");
      return;
    }
    if (form.password.length < 6) {
      setError("密码至少6位");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          name: form.name,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "初始化失败");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("初始化成功但自动登录失败，请手动登录");
      }
    } catch {
      setError("网络错误");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-warm">
        <Loader2 className="w-6 h-6 text-caramel animate-spin mb-3" />
        <p className="text-sm text-text-secondary">检查系统状态...</p>
      </div>
    );
  }

  if (!needsSetup) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-warm">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E\")",
          opacity: 0.03,
        }}
      />

      <Card className="w-full max-w-md relative z-10 shadow-lg border-border-warm bg-card-cream animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center text-white shadow-md mx-auto mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl font-bold text-coffee font-serif">系统初始化</CardTitle>
          <CardDescription className="text-text-secondary">
            检测到首次使用，请创建家长管理员账号
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">登录用户名</label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="仅支持字母、数字和下划线"
                className="border-border-warm bg-bg-warm/30 focus-visible:ring-caramel/30"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">显示昵称</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：彤彤妈妈"
                className="border-border-warm bg-bg-warm/30 focus-visible:ring-caramel/30"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">登录密码</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="至少6位"
                className="border-border-warm bg-bg-warm/30 focus-visible:ring-caramel/30"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-secondary">确认密码</label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="再次输入密码"
                className="border-border-warm bg-bg-warm/30 focus-visible:ring-caramel/30"
                required
              />
            </div>
          </CardContent>

          <div className="px-6 pb-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-caramel hover:bg-amber-700 text-white font-medium transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>创建中...</span>
                </span>
              ) : (
                "创建管理员账号并登录"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
