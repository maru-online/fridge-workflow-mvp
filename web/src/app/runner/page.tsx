import Link from "next/link";
import { MapPin, Calendar, ArrowRight, QrCode } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { formatDistanceToNow } from 'date-fns';

export default async function RunnerHomePage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch assigned tickets for current user
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      *,
      leads:lead_id (
        customer_name,
        villages:village_id (name)
      )
    `)
    .eq('assigned_to', user?.id || '')
    .in('status', ['open', 'assigned', 'in_progress'])
    .order('created_at', { ascending: true });
  
  const assignedTickets = tickets || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Today's Route</h2>
        <p className="text-slate-500 text-sm">
          {assignedTickets.length} {assignedTickets.length === 1 ? 'job' : 'jobs'} remaining
        </p>
      </div>

      <div className="space-y-4">
        {assignedTickets.length > 0 ? (
          assignedTickets.map((ticket: any) => (
            <Link
              key={ticket.id}
              href={`/runner/fridge/${ticket.fridge_code}`}
              className="block bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform hover:border-brand-blue hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <QrCode size={14} className="text-slate-400" />
                  <span className="font-mono text-xs text-slate-600">{ticket.fridge_code}</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    ticket.type === "sell"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {ticket.type}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                {ticket.leads?.customer_name || 'Unknown Customer'}
              </h3>
              {ticket.leads?.villages && (
                <div className="flex items-center text-slate-500 text-sm gap-4">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {ticket.leads.villages.name}
                  </div>
                  {ticket.scheduled_for && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(ticket.scheduled_for).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-2 text-xs text-slate-400">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
            <p className="text-slate-500 mb-2">No assigned tickets</p>
            <p className="text-sm text-slate-400">Check back later or scan a QR code to start a job.</p>
          </div>
        )}
      </div>

       <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-brand-blue mb-1">Ready for more?</h3>
          <p className="text-sm text-slate-600 mb-3">Scan a fridge QR code to log an ad-hoc visit or verification.</p>
           <Link
            href="/runner/scan"
            className="w-full bg-white text-brand-blue font-semibold py-2 rounded-lg border border-blue-200 block text-center shadow-sm hover:bg-blue-50 transition-colors"
          >
            Open Scanner
          </Link>
       </div>
    </div>
  );
}
