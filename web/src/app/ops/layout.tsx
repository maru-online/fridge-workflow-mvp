import Link from "next/link";
import { LayoutDashboard, Users, Ticket, Settings, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function OpsLayout({
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            FridgeOps
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink href="/ops" icon={<LayoutDashboard size={20} />}>
            Dashboard
          </NavLink>
          <NavLink href="/ops/leads" icon={<Users size={20} />}>
            Leads
          </NavLink>
          <NavLink href="/ops/tickets" icon={<Ticket size={20} />}>
            Tickets
          </NavLink>
          <NavLink href="/ops/runners" icon={<User size={20} />}>
            Runners
          </NavLink>
          <NavLink href="/ops/settings" icon={<Settings size={20} />}>
            Settings
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600">
            <div className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-slate-900">
                {user.email}
              </p>
              <p className="truncate text-xs text-slate-500">Admin</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
             <button className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
               <LogOut size={16} />
               Sign Out
             </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50/50">
        <div className="max-w-7xl mx-auto p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:text-brand-blue hover:bg-blue-50 transition-all font-medium"
    >
      {icon}
      {children}
    </Link>
  );
}
