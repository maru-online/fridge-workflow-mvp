'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'

export default function ScanPage() {
    const [scanning, setScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [permissionDenied, setPermissionDenied] = useState(false)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const router = useRouter()
    const scanAreaId = 'qr-reader'

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {})
                scannerRef.current.clear()
            }
        }
    }, [])

    async function startScanning() {
        try {
            setError(null)
            setPermissionDenied(false)
            setScanning(true)

            const html5QrCode = new Html5Qrcode(scanAreaId)
            scannerRef.current = html5QrCode

            await html5QrCode.start(
                { facingMode: 'environment' }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // Successfully scanned
                    handleScanSuccess(decodedText)
                },
                () => {
                    // Ignore scanning errors (they're frequent during scanning)
                }
            )
        } catch (err: unknown) {
            console.error('Error starting scanner:', err)
            setScanning(false)
            
            const errInfo =
                typeof err === 'object' && err !== null
                    ? (err as { name?: string; message?: string })
                    : undefined
            if (errInfo?.name === 'NotAllowedError' || errInfo?.message?.includes('permission')) {
                setPermissionDenied(true)
                setError('Camera permission denied. Please allow camera access and try again.')
            } else if (errInfo?.name === 'NotFoundError') {
                setError('No camera found. Please connect a camera and try again.')
            } else {
                setError('Failed to start camera. Please try again.')
            }
        }
    }

    async function stopScanning() {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
                scannerRef.current.clear()
                scannerRef.current = null
            } catch (err) {
                console.error('Error stopping scanner:', err)
            }
        }
        setScanning(false)
    }

    function handleScanSuccess(code: string) {
        // Validate code format (should be like SELL-YYYYMMDD-XXX or REP-YYYYMMDD-XXX)
        const codePattern = /^(SELL|REP)-\d{8}-\d{3}$/
        if (!codePattern.test(code)) {
            setError('Invalid QR code format. Please scan a valid fridge code.')
            return
        }

        // Stop scanning
        stopScanning()

        // Navigate to fridge page
        router.push(`/runner/fridge/${code}`)
    }

    return (
        <div className="h-[80vh] flex flex-col relative">
            <Link 
                href="/runner" 
                className="absolute right-0 top-0 p-2 z-20 text-white bg-black/50 rounded-full backdrop-blur-sm"
                onClick={stopScanning}
            >
                <X size={24} />
            </Link>

            {/* Scanner Container */}
            <div className="flex-1 bg-black rounded-2xl overflow-hidden relative flex items-center justify-center">
                <div id={scanAreaId} className="w-full h-full"></div>
                
                {!scanning && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-white/50 text-sm text-center px-4 mb-4">
                            Point camera at Fridge QR Code
                        </p>
                        <button
                            onClick={startScanning}
                            className="bg-brand-blue text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-colors"
                        >
                            <Camera size={20} />
                            Start Scanning
                        </button>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
                        <AlertCircle className="text-red-500 mb-4" size={48} />
                        <p className="text-white text-sm text-center mb-4">{error}</p>
                        {permissionDenied ? (
                            <p className="text-white/70 text-xs text-center mb-4">
                                Go to your browser settings to allow camera access for this site.
                            </p>
                        ) : null}
                        <button
                            onClick={() => {
                                setError(null)
                                setPermissionDenied(false)
                            }}
                            className="bg-brand-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue/90 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {scanning && (
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                        <button
                            onClick={stopScanning}
                            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Stop Scanning
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <p className="text-center text-slate-500 text-sm mb-4">Having trouble?</p>
                <Link 
                    href="/runner/scan/manual"
                    className="w-full bg-brand-blue text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-colors"
                    onClick={stopScanning}
                >
                    <Camera size={20} />
                    Enter Code Manually
                </Link>
            </div>
        </div>
    )
}
