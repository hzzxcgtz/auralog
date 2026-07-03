import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForbiddenPage() {
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

      <div className="text-center relative z-10">
        <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-caramel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-coffee font-serif mb-2">咦，这里不是你该来的地方哦</h1>
        <p className="text-sm text-text-secondary mb-6">这是家长管理后台，请回到你的学习空间继续努力吧~</p>
        <Link href="/">
          <Button className="bg-caramel hover:bg-amber-700 text-white">
            返回学习空间
          </Button>
        </Link>
      </div>
    </div>
  );
}
