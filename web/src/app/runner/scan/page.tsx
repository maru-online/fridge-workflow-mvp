'use client'

import { useState } from 'react'
import { Camera, X } from 'lucide-react'
import Link from 'next/link'

export default function ScanPage() {
    const [scanned, setScanned] = useState(false)

    return (
        <div className="h-[80vh] flex flex-col relative">
            <Link href="/runner" className="absolute right-0 top-0 p-2 z-20 text-white bg-black/50 rounded-full backdrop-blur-sm">
                <X size={24} />
            </Link>

            {/* Camera Viewport Placeholder */}
            <div className="flex-1 bg-black rounded-2xl overflow-hidden relative flex items-center justify-center">
                 <p className="text-white/50 text-sm absolute bottom-10 text-center w-full px-4">
                     Point camera at Fridge QR Code
                 </p>
                 
                 {/* Scanner Overlay */}
                 <div className="w-64 h-64 border-2 border-brand-orange/50 rounded-lg relative">
                     <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-orange -mt-1 -ml-1"></div>
                     <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-orange -mt-1 -mr-1"></div>
                     <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-orange -mb-1 -ml-1"></div>
                     <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-orange -mb-1 -mr-1"></div>
                     
                     {/* Scanning Animation */}
                     <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-blue animate-[scan_2s_ease-in-out_infinite] opacity-80 shadow-[0_0_8px_rgba(2,77,158,0.8)]"></div>
                 </div>
            </div>

            <div className="mt-4">
                <p className="text-center text-slate-500 text-sm mb-4">Having trouble?</p>
                <Link 
                    href="/runner/scan/manual"
                    className="w-full bg-brand-blue text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-colors"
                >
                    <Camera size={20} />
                    Enter Code Manually
                </Link>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
            `}</style>
        </div>
    )
}
