"use client";

import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, ExternalLink } from "lucide-react";
import Link from "next/link";

export function AdminTopbar() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          访问前台
        </Link>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer outline-none">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-amber-500/10 text-amber-600 text-sm font-medium">
              {session?.user?.name?.[0] || "A"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-slate-700">
            {session?.user?.name || "管理员"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            {session?.user?.email || "admin"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
