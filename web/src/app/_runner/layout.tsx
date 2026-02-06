import Link from "next/link";
import { Home, Scan, User, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function RunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans">
      {/* Mobile Header */}
      <header className="bg-brand-blue p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center text-white">
        <h1 className="font-bold text-lg">FridgeRunner</h1>
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium opacity-90 truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
            <form action="/auth/signout" method="post">
                <button className="text-white/80 hover:text-brand-orange transition-colors">
                    <LogOut size={18} />
                </button>
            </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-md mx-auto">{children}</main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-20">
        <NavLink href="/runner" icon={<Home size={24} />} label="Tasks" />
        <Link
          href="/runner/scan"
          className="bg-brand-blue text-white p-3 rounded-full -mt-8 shadow-lg border-4 border-slate-100 flex items-center justify-center transform active:scale-95 transition hover:bg-brand-blue/90"
        >
          <Scan size={24} />
        </Link>
        <NavLink href="/runner/profile" icon={<User size={24} />} label="Profile" />
      </nav>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-brand-blue transition"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
