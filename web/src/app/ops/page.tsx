import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNow } from 'date-fns';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch quick stats
  const { count: leadCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  const { count: ticketCount } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true });

  // Fetch recent tickets
  const { data: recentTickets } = await supabase
    .from("tickets")
    .select("*")
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch recent leads
  const { data: recentLeads } = await supabase
    .from("leads")
    .select("*")
    .order('created_at', { ascending: false })
    .limit(5);

  // Combine and sort activities
  const activities = [
    ...(recentTickets?.map(t => ({ ...t, type: 'ticket' as const, date: new Date(t.created_at) })) || []),
    ...(recentLeads?.map(l => ({ ...l, type: 'lead' as const, date: new Date(l.created_at) })) || [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime())
   .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500">Welcome back to the operations center.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Leads" value={leadCount || 0} trend="+12%" />
        <StatCard
          title="Open Tickets"
          value={ticketCount || 0}
          trend="+5%"
          color="orange"
        />
        <StatCard title="Revenue (Est)" value="R 4,200" trend="+8%" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {activities.map((item) => (
                <ActivityItem 
                   key={`${item.type}-${item.id}`}
                   text={item.type === 'ticket' 
                     ? `New Ticket: ${item.category} (${item.fridge_code})`
                     : `New Lead: ${item.customer_name || 'Unknown'}`
                   }
                   time={`${formatDistanceToNow(new Date(item.created_at))} ago`} 
                   type={item.type}
                   details={item.type === 'ticket' ? item.description : item.notes}
                />
            ))}
            
            {activities.length === 0 && (
                <p className="text-sm text-slate-400 italic">No recent activity.</p>
            )}
          </div>
        </div>

         {/* Quick Actions */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 rounded-lg bg-blue-50 text-brand-blue hover:bg-blue-100 transition flex flex-col items-center justify-center gap-2">
                <span className="font-semibold">New Ticket</span>
                <span className="text-xs opacity-70">Assign manual job</span>
            </button>
             <button className="p-4 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex flex-col items-center justify-center gap-2">
                <span className="font-semibold">Broadcast</span>
                <span className="text-xs opacity-70">Send WhatsApp blast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  color = "blue",
}: {
  title: string;
  value: string | number;
  trend: string;
  color?: "blue" | "orange" | "green";
}) {
  const colors = {
    blue: "text-brand-blue bg-blue-50",
    orange: "text-brand-orange bg-orange-50",
    green: "text-green-600 bg-green-50",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${colors[color]}`}>
          {trend}
        </span>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function ActivityItem({ text, time, type, details }: { text: string; time: string; type: 'lead' | 'ticket'; details?: string }) {
    return (
        <div className="flex items-start gap-3">
             <div className={`mt-1 w-2 h-2 rounded-full ${type === 'lead' ? 'bg-cyan-500' : 'bg-brand-orange'}`} />
             <div>
                 <p className="text-sm text-slate-700 font-medium">{text}</p>
                 {details && <p className="text-xs text-slate-500 truncate max-w-xs">{details}</p>}
                 <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>
             </div>
        </div>
    )
}
