'use client'

import React, { useState } from 'react'
import { ArrowLeft, Camera, Upload, AlertTriangle, Send } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { createClient } from '@/utils/supabase/client'

const ISSUE_CATEGORIES = [
    { id: 'not_cooling', label: 'Not Cooling', icon: '❄️' },
    { id: 'noisy', label: 'Noisy/Vibrating', icon: '🔊' },
    { id: 'leaking', label: 'Leaking Water', icon: '💧' },
    { id: 'electrical', label: 'Electrical/Power', icon: '⚡' },
    { id: 'physical', label: 'Physical Damage', icon: '🔨' },
    { id: 'other', label: 'Other', icon: '❓' },
]

export default function ReportIssuePage() {
    const params = useParams()
    const router = useRouter()
    const code = params?.code as string
    const supabase = createClient()
    
    const [selectedCategory, setSelectedCategory] = useState('')
    const [description, setDescription] = useState('')
    const [photo, setPhoto] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [ticketId, setTicketId] = useState<string | null>(null)

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            setPhoto(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        
        try {
            // Capture GPS coordinates
            const { getCurrentPosition } = await import('@/utils/geolocation')
            const position = await getCurrentPosition()
            const gpsString = position ? `${position.latitude},${position.longitude}` : null

            // Get current user for upload tracking
            const { data: { user } } = await supabase.auth.getUser()
            
            // Create ticket first
            const { data: ticket, error: ticketError } = await supabase
                .from('tickets')
                .insert({
                    fridge_code: code,
                    category: selectedCategory,
                    description: description,
                    status: 'open',
                    type: 'repair',
                    location_gps: gpsString
                })
                .select()
                .single()
            
            if (ticketError) {
                throw ticketError
            }

            setTicketId(ticket.id)

            // Upload photo if provided
            if (photo && ticket.id) {
                const fileExt = photo.name.split('.').pop()
                const fileName = `ticket-photos/${ticket.id}-${Date.now()}.${fileExt}`
                
                const { error: uploadError } = await supabase.storage
                    .from('photos')
                    .upload(fileName, photo, {
                        contentType: photo.type,
                        upsert: false,
                    })

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError)
                    // Continue even if photo upload fails
                } else {
                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('photos')
                        .getPublicUrl(fileName)

                    // Link photo to ticket in ticket_photos table
                    await supabase
                        .from('ticket_photos')
                        .insert({
                            ticket_id: ticket.id,
                            storage_path: urlData.publicUrl,
                            caption: `Issue photo: ${selectedCategory}`,
                            uploaded_by: user?.id || null
                        })

                    // Update ticket with image URL
                    await supabase
                        .from('tickets')
                        .update({ image_url: urlData.publicUrl })
                        .eq('id', ticket.id)
                }
            }
            
            router.push('/runner') 
        } catch (error: any) {
            console.error('Error submitting ticket:', error)
            alert('Failed to submit ticket. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-safe">
             {/* Header */}
             <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href={`/runner/fridge/${code}`} className="text-slate-500 hover:text-brand-blue">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="font-bold text-lg text-slate-800">Report Issue</h1>
                    <p className="text-xs text-slate-500 font-mono">Ref: {code}</p>
                </div>
            </header>

            <main className="flex-1 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Categories */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            What's the problem?
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {ISSUE_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                        selectedCategory === cat.id
                                            ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50/50'
                                    }`}
                                >
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span className="text-xs font-semibold text-center">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Details
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue... (e.g. Fridge stopped working yesterday, making loud buzzing noise)"
                            className="w-full h-32 p-4 rounded-xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none resize-none"
                        ></textarea>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            Add Photo (Optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            capture="environment"
                            className="hidden"
                            id="issue-photo"
                        />
                        <label
                            htmlFor="issue-photo"
                            className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50/10 transition-all cursor-pointer"
                        >
                            {photoPreview ? (
                                <img
                                    src={photoPreview}
                                    alt="Issue photo preview"
                                    className="max-w-full max-h-64 rounded-lg"
                                />
                            ) : (
                                <>
                                    <Camera size={24} />
                                    <span className="text-sm font-medium">Tap to take photo</span>
                                </>
                            )}
                        </label>
                        {photo && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPhoto(null)
                                    setPhotoPreview(null)
                                }}
                                className="text-xs text-red-600 hover:text-red-700"
                            >
                                Remove photo
                            </button>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!selectedCategory || isSubmitting}
                        className="w-full bg-red-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-8"
                    >
                         {isSubmitting ? (
                                <span>Submitting...</span>
                            ) : (
                                <>
                                    Submit Ticket
                                    <Send size={20} />
                                </>
                            )}
                    </button>
                    
                    <p className="text-center text-xs text-slate-400 pt-4">
                        This will dispatch a ticket to the operations dashboard.
                    </p>

                </form>
            </main>
        </div>
    )
}
