'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ManualEntryPage() {
    const router = useRouter()
    const supabase = createClient()
    const [code, setCode] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsVerifying(true)
        
        try {
            // Validate code format
            const codePattern = /^(SELL|REP)-\d{8}-\d{3}$/
            const normalizedCode = code.trim().toUpperCase()
            
            if (!codePattern.test(normalizedCode)) {
                setError('Invalid code format. Expected format: SELL-YYYYMMDD-XXX or REP-YYYYMMDD-XXX')
                setIsVerifying(false)
                return
            }

            // Verify code exists in database
            const { data: ticket, error: ticketError } = await supabase
                .from('tickets')
                .select('id, fridge_code, status')
                .eq('fridge_code', normalizedCode)
                .single()

            if (ticketError || !ticket) {
                setError('Code not found. Please check the code and try again, or contact support.')
                setIsVerifying(false)
                return
            }

            // Redirect to fridge details/action page
            router.push(`/runner/fridge/${normalizedCode}`)
        } catch (err: unknown) {
            console.error('Error verifying code:', err)
            setError('Failed to verify code. Please check your connection and try again.')
            setIsVerifying(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href="/runner/scan" className="text-slate-500 hover:text-brand-blue">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="font-bold text-lg text-slate-800">Manual Entry</h1>
            </header>

            <main className="flex-1 p-6 flex flex-col">
                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-brand-blue mb-2">Enter Fridge Code</h2>
                        <p className="text-slate-500">
                            Type the alphanumeric code found on the fridge sticker (e.g., F-1234).
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    setCode(e.target.value.toUpperCase())
                                    setError(null)
                                }}
                                placeholder="SELL-20250122-001"
                                className={`w-full text-center text-2xl font-mono tracking-widest font-bold text-slate-800 border-2 rounded-xl p-4 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 uppercase ${
                                    error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-brand-blue'
                                }`}
                                autoFocus
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Format: SELL-YYYYMMDD-XXX or REP-YYYYMMDD-XXX
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!code || isVerifying}
                            className="w-full bg-brand-blue text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    Verify Code
                                    <CheckCircle2 size={24} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}
