'use client'

import React from 'react'
import { ArrowLeft, MapPin, CheckCircle, AlertTriangle, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function FridgeActionPage() {
    // Need to unwrap params in Next.js 15+ (async) but for client component using standard hook might need structure check
    // Actually in Next 15 params promise is standard but useParams hook handles it in client components usually
    // Let's stick to standard hook usage
    const params = useParams()
    const code = params?.code as string

    // Mock Fridge Data
    const fridge = {
        code: code,
        model: 'CoolMaster 3000',
        location: 'Spar, Village Main',
        last_visit: '2 weeks ago',
        status: 'Operational'
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-brand-blue p-6 pb-12 shadow-sm text-white sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/runner/scan" className="text-white/80 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-lg">Fridge Details</h1>
                </div>
                <div>
                    <h2 className="text-3xl font-bold mb-1">{fridge.code}</h2>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        <MapPin size={16} />
                        {fridge.location}
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 -mt-8">
                {/* Status Card */}
                <div className="bg-white rounded-xl p-4 shadow-md mb-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Status</span>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase">
                            {fridge.status}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Last Visit</span>
                        <span className="text-slate-800 font-medium text-sm">
                            {fridge.last_visit}
                        </span>
                    </div>
                </div>

                <h3 className="font-bold text-slate-800 mb-4 px-1">Select Action</h3>

                <div className="space-y-4">
                    <Link 
                        href={`/runner/fridge/${code}/verify`}
                        className="w-full bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-brand-blue hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                        <div className="bg-blue-50 text-brand-blue p-3 rounded-full group-hover:bg-brand-blue group-hover:text-white transition-colors">
                            <CheckCircle size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-slate-800">Verify Asset</h4>
                            <p className="text-slate-500 text-sm">Confirm fridge is present and working.</p>
                        </div>
                    </Link>

                    <Link 
                        href={`/runner/fridge/${code}/stats`}
                        className="w-full bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-brand-blue hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                         <div className="bg-orange-50 text-brand-orange p-3 rounded-full group-hover:bg-brand-orange group-hover:text-white transition-colors">
                            <ClipboardList size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-slate-800">Log Stats</h4>
                            <p className="text-slate-500 text-sm">Record temperature and content check.</p>
                        </div>
                    </Link>

                    <Link 
                         href={`/runner/fridge/${code}/report`}
                         className="w-full bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-red-500 hover:shadow-md transition-all flex items-center gap-4 group"
                    >
                        <div className="bg-red-50 text-red-500 p-3 rounded-full group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-slate-800">Report Issue</h4>
                            <p className="text-slate-500 text-sm">Log a breakdown or maintenance need.</p>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    )
}
