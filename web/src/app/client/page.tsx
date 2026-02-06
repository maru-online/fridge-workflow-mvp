import { createClient } from '@/utils/supabase/server'
import { Plus, Package, Clock } from 'lucide-react'
import Link from 'next/link'

type Lead = {
  id: string
  status: string | null
  created_at: string | null
}

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in</div>
  }

  // Fetch leads associated with this user's phone number
  // First, get the user's profile to get the phone number
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_number')
    .eq('id', user.id)
    .single()

  let myLeads: Lead[] = []
  if (profile?.phone_number) {
    // Basic normalization: remove spaces, ensure partial match might work if formatting differs?
    // For MVP, we assume exact match or based on whatsapp_id if we linked it.
    // Actually, leads table has whatsapp_id.
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('whatsapp_id', profile.phone_number)
      .order('created_at', { ascending: false })
    
    myLeads = data || []
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Requests</h1>
            <p className="text-sm text-slate-500">Track your fridge pickups</p>
          </div>
          <div className="w-8 h-8 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue font-bold">
            {profile?.phone_number?.slice(-2)}
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Stats or Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="text-2xl font-bold text-slate-800">{myLeads.length}</div>
            <div className="text-xs text-slate-500">Total Requests</div>
          </div>
          <Link href="/client/new" className="bg-brand-blue p-4 rounded-xl shadow-md flex flex-col items-center justify-center text-white active:scale-95 transition-transform">
             <Plus size={24} className="mb-1" />
             <span className="text-sm font-bold">New Pickup</span>
          </Link>
        </div>

        {/* Active Requests List */}
        <div>
           <h2 className="font-bold text-slate-800 mb-3 px-1">Recent Activity</h2>
           <div className="space-y-3">
             {myLeads.length > 0 ? (
               myLeads.map((lead) => (
                 <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                       <span className="font-mono text-xs text-slate-500">REF: {lead.id}</span>
                       <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                         lead.status === 'converted' ? 'bg-green-100 text-green-700' :
                         lead.status === 'qualified' ? 'bg-blue-100 text-blue-700' :
                         'bg-slate-100 text-slate-600'
                       }`}>
                         {lead.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                       <Package size={16} className="text-slate-400" />
                       <span className="font-medium text-slate-800">Fridge Pickup</span>
                    </div>
                    {lead.created_at && (
                       <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock size={12} />
                          {new Date(lead.created_at).toLocaleDateString()}
                       </div>
                    )}
                 </div>
               ))
             ) : (
               <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                 <Package size={32} className="mx-auto mb-2 opacity-50" />
                 <p>No requests found</p>
               </div>
             )}
           </div>
        </div>
      </main>
    </div>
  )
}
