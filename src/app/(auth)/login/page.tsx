"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("用户名或密码错误");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md mx-4 shadow-2xl border-slate-700 bg-slate-800/50 backdrop-blur">
      <CardHeader className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center">
          <Lightbulb className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-white">
            SysLED 管理系统
          </CardTitle>
          <CardDescription className="text-slate-400">
            请输入管理员账号登录
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-300">
              用户名
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              placeholder="请输入用户名"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              密码
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="请输入密码"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              "登 录"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
