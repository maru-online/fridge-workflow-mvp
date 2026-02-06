'use client'

import { MapPin } from 'lucide-react'

export default function LocationLogger() {
  const handleLogLocation = async () => {
    try {
      const { getCurrentPosition } = await import('@/utils/geolocation')
      const pos = await getCurrentPosition()
      if (pos) {
        alert(`Location logged: ${pos.latitude}, ${pos.longitude}`)
        // In a real app, we might send this to a tracking table
      } else {
        alert('Failed to get location. Please ensure GPS is enabled.')
      }
    } catch (err) {
      console.error(err)
      alert('Error accessing camera/GPS')
    }
  }

  return (
    <button 
      onClick={handleLogLocation}
      className="text-xs flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
    >
      <MapPin size={12} />
      Log Location
    </button>
  )
}
