import Link from "next/link";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function RunnerHomePage() {
  const supabase = await createClient();
  
  // Mock data for now - replace with real DB query later
  // const { data: tickets } = await supabase.from('tickets').select('*').eq('assigned_to', user.id)
  
  const tickets = [
    {
      id: 101,
      type: "install",
      location: "Village A, Shop 4",
      status: "open",
      time: "10:00 AM",
    },
    {
      id: 102,
      type: "repair",
      location: "Village B, Main St",
      status: "in_progress",
      time: "02:00 PM",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Today's Route</h2>
        <p className="text-slate-500 text-sm">2 jobs remaining</p>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/runner/job/${ticket.id}`}
            className="block bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                  ticket.type === "install"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {ticket.type}
              </span>
              <span className="text-xs text-slate-400">#{ticket.id}</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">
              {ticket.location}
            </h3>
            <div className="flex items-center text-slate-500 text-sm gap-4">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {ticket.time}
              </div>
              <div className="flex items-center gap-1">
                 <MapPin size={14} />
                 2.5km
              </div>
            </div>
          </Link>
        ))}
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
