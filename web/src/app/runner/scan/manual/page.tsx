'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ManualEntryPage() {
    const router = useRouter()
    const [code, setCode] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsVerifying(true)
        
        // Mock verification delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Redirect to fridge details/action page
        router.push(`/runner/fridge/${code}`)
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
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="F-XXXX"
                                className="w-full text-center text-3xl font-mono tracking-widest font-bold text-slate-800 border-2 border-slate-200 rounded-xl p-4 focus:border-brand-blue focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300 uppercase"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!code || isVerifying}
                            className="w-full bg-brand-blue text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <span>Verifying...</span>
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
