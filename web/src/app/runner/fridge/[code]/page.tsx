'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, CheckCircle, AlertTriangle, ClipboardList, User, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface Ticket {
    id: string
    fridge_code: string
    type: 'sell' | 'repair' | 'maintenance'
    status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'closed'
    description: string | null
    scheduled_for: string | null
    created_at: string
    leads?: {
        customer_name: string | null
        whatsapp_id: string
        villages?: { name: string } | null
    } | null
}

export default function FridgeActionPage() {
    const params = useParams()
    const code = params?.code as string
    const supabase = createClient()
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadTicket()
    }, [code])

    async function loadTicket() {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    leads:lead_id (
                        customer_name,
                        whatsapp_id,
                        villages:village_id (name)
                    )
                `)
                .eq('fridge_code', code)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    setError('Ticket not found. This QR code may not be registered yet.')
                } else {
                    throw error
                }
            } else {
                setTicket(data)
            }
        } catch (err: any) {
            console.error('Error loading ticket:', err)
            setError('Failed to load ticket information.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-blue" size={32} />
            </div>
        )
    }

    if (error || !ticket) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <header className="bg-brand-blue p-6 pb-12 shadow-sm text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/runner/scan" className="text-white/80 hover:text-white">
                            <ArrowLeft size={24} />
                        </Link>
                        <h1 className="font-bold text-lg">Fridge Details</h1>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-1">{code}</h2>
                    </div>
                </header>
                <main className="flex-1 p-6 -mt-8">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-red-200">
                        <AlertTriangle className="text-red-500 mb-4" size={32} />
                        <h3 className="font-bold text-slate-900 mb-2">Ticket Not Found</h3>
                        <p className="text-slate-600 mb-4">{error || 'This QR code is not associated with any ticket.'}</p>
                        <Link
                            href="/runner/scan"
                            className="inline-block bg-brand-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue/90 transition-colors"
                        >
                            Scan Again
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    const statusColors = {
        open: 'bg-blue-100 text-blue-700',
        assigned: 'bg-yellow-100 text-yellow-700',
        in_progress: 'bg-orange-100 text-orange-700',
        completed: 'bg-green-100 text-green-700',
        closed: 'bg-slate-100 text-slate-700',
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-brand-blue p-6 pb-12 shadow-sm text-white sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/runner/scan" className="text-white/80 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-lg">Ticket Details</h1>
                </div>
                <div>
                    <h2 className="text-3xl font-bold mb-1 font-mono">{ticket.fridge_code}</h2>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ticket.type === 'sell' ? 'bg-green-500/20' : 'bg-orange-500/20'
                        }`}>
                            {ticket.type.toUpperCase()}
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 -mt-8">
                {/* Ticket Info Card */}
                <div className="bg-white rounded-xl p-4 shadow-md mb-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Status</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${statusColors[ticket.status]}`}>
                            {ticket.status.replace('_', ' ')}
                        </span>
                    </div>
                    
                    {ticket.leads && (
                        <>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Customer</span>
                                <span className="text-slate-800 font-medium text-sm">
                                    {ticket.leads.customer_name || 'Unknown'}
                                </span>
                            </div>
                            {ticket.leads.villages && (
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Location</span>
                                    <div className="flex items-center gap-1 text-slate-800 text-sm">
                                        <MapPin size={12} />
                                        <span>{ticket.leads.villages.name}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {ticket.scheduled_for && (
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Scheduled</span>
                            <div className="flex items-center gap-1 text-slate-800 text-sm">
                                <Calendar size={12} />
                                <span>{new Date(ticket.scheduled_for).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Created</span>
                        <span className="text-slate-800 font-medium text-sm">
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    {ticket.description && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Description</span>
                            <p className="text-slate-700 text-sm">{ticket.description}</p>
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-slate-800 mb-4 px-1">Select Action</h3>

                <div className="space-y-4">
                    {ticket.type === 'sell' && ticket.status !== 'completed' && (
                        <Link 
                            href={`/runner/fridge/${code}/verify`}
                            className="w-full bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-brand-blue hover:shadow-md transition-all flex items-center gap-4 group"
                        >
                            <div className="bg-blue-50 text-brand-blue p-3 rounded-full group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                <CheckCircle size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-slate-800">Verify Payment</h4>
                                <p className="text-slate-500 text-sm">Confirm payment received and complete the sale.</p>
                            </div>
                        </Link>
                    )}

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
