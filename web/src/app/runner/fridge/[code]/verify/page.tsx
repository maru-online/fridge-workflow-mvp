'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Camera, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Ticket {
    id: string
    fridge_code: string
    type: 'sell' | 'repair' | 'maintenance'
    status: string
    lead_id: number | null
    image_url: string | null
    leads?: {
        customer_name: string | null
        whatsapp_id: string
    } | null
}

export default function VerifyPaymentPage() {
    const params = useParams()
    const router = useRouter()
    const code = params?.code as string
    const supabase = createClient()
    
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [loading, setLoading] = useState(true)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentProof, setPaymentProof] = useState<File | null>(null)
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
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
                        whatsapp_id
                    )
                `)
                .eq('fridge_code', code)
                .single()

            if (error) throw error
            setTicket(data)
        } catch (err: any) {
            console.error('Error loading ticket:', err)
            setError('Failed to load ticket information.')
        } finally {
            setLoading(false)
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setPaymentProof(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPaymentProofPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            setError('Please enter a valid payment amount.')
            return
        }

        if (!ticket) {
            setError('Ticket not found.')
            return
        }

        setIsSubmitting(true)

        try {
            // Get current user for upload tracking
            const { data: { user } } = await supabase.auth.getUser()

            // Upload payment proof if provided
            let proofUrl: string | null = null
            if (paymentProof) {
                const fileExt = paymentProof.name.split('.').pop()
                const fileName = `payment-proofs/${ticket.fridge_code}-${Date.now()}.${fileExt}`
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('photos')
                    .upload(fileName, paymentProof, {
                        contentType: paymentProof.type,
                        upsert: false,
                    })

                if (uploadError) {
                    throw new Error('Failed to upload payment proof')
                }

                const { data: urlData } = supabase.storage
                    .from('photos')
                    .getPublicUrl(fileName)
                
                proofUrl = urlData.publicUrl

                // Link payment proof to ticket_photos table
                await supabase
                    .from('ticket_photos')
                    .insert({
                        ticket_id: ticket.id,
                        storage_path: proofUrl,
                        caption: `Payment proof: R ${paymentAmount}`,
                        uploaded_by: user?.id || null
                    })
            }

            // Update ticket status to completed
            const { error: updateError } = await supabase
                .from('tickets')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    image_url: proofUrl || ticket.image_url,
                })
                .eq('id', ticket.id)

            if (updateError) throw updateError

            // Update lead status to converted
            if (ticket.lead_id) {
                await supabase
                    .from('leads')
                    .update({ status: 'converted' })
                    .eq('id', ticket.lead_id)
            }

            // Send WhatsApp confirmation to customer
            if (ticket.leads?.whatsapp_id) {
              try {
                const response = await fetch('/api/notifications', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    type: 'payment_received',
                    whatsapp_id: ticket.leads.whatsapp_id,
                    ticket_id: ticket.id,
                    lead_id: ticket.lead_id,
                    data: {
                      amount: paymentAmount,
                      fridge_code: ticket.fridge_code,
                      customer_name: ticket.leads.customer_name,
                    },
                  }),
                })

                if (!response.ok) {
                  console.error('Failed to send WhatsApp notification')
                  // Don't fail the whole operation if notification fails
                }
              } catch (notifError) {
                console.error('Error sending notification:', notifError)
                // Continue even if notification fails
              }
            }

            // Redirect to success page or back to runner home
            router.push(`/runner/fridge/${code}?verified=true`)
        } catch (err: any) {
            console.error('Error completing payment verification:', err)
            setError(err.message || 'Failed to complete payment verification. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-blue" size={32} />
            </div>
        )
    }

    if (error && !ticket) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <header className="bg-white p-4 shadow-sm flex items-center gap-4">
                    <Link href={`/runner/fridge/${code}`} className="text-slate-500 hover:text-brand-blue">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="font-bold text-lg text-slate-800">Payment Verification</h1>
                </header>
                <main className="flex-1 p-6">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-red-200">
                        <AlertCircle className="text-red-500 mb-4" size={32} />
                        <h3 className="font-bold text-slate-900 mb-2">Error</h3>
                        <p className="text-slate-600">{error}</p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-safe">
            <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href={`/runner/fridge/${code}`} className="text-slate-500 hover:text-brand-blue">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="font-bold text-lg text-slate-800">Payment Verification</h1>
                    <p className="text-xs text-slate-500 font-mono">Ref: {code}</p>
                </div>
            </header>

            <main className="flex-1 p-6">
                {ticket && ticket.leads && (
                    <div className="bg-white rounded-xl p-4 shadow-md mb-6 border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-2">Customer Information</h3>
                        <p className="text-slate-600 text-sm">
                            <span className="font-medium">{ticket.leads.customer_name || 'Unknown Customer'}</span>
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Payment Amount (ZAR)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className="w-full text-3xl font-bold text-center text-slate-800 border-2 border-slate-200 rounded-xl p-4 focus:border-brand-blue focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Payment Proof (Optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="payment-proof"
                        />
                        <label
                            htmlFor="payment-proof"
                            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50/10 transition-all cursor-pointer"
                        >
                            {paymentProofPreview ? (
                                <img
                                    src={paymentProofPreview}
                                    alt="Payment proof preview"
                                    className="max-w-full max-h-64 rounded-lg"
                                />
                            ) : (
                                <>
                                    <Camera size={24} />
                                    <span className="text-sm font-medium">Tap to take/upload photo</span>
                                </>
                            )}
                        </label>
                        {paymentProof && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentProof(null)
                                    setPaymentProofPreview(null)
                                }}
                                className="text-xs text-red-600 hover:text-red-700"
                            >
                                Remove photo
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!paymentAmount || isSubmitting}
                        className="w-full bg-green-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-8"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Completing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                <span>Complete Payment</span>
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-slate-400 pt-4">
                        This will mark the ticket as completed and update the lead status.
                    </p>
                </form>
            </main>
        </div>
    )
}
