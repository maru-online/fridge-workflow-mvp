'use client'

import { X, Image, MapPin, Calendar, User, QrCode } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { maskPhoneNumber } from '@/utils/data-masking'

interface Ticket {
  id: string
  fridge_code: string
  category: string
  type: 'sell' | 'repair' | 'maintenance'
  status: string
  description: string | null
  assigned_to: string | null
  image_url: string | null
  scheduled_for: string | null
  completed_at: string | null
  created_at: string
  leads?: {
    customer_name: string | null
    whatsapp_id: string
    villages?: { name: string } | null
  } | null
  profiles?: {
    full_name: string | null
  } | null
}

interface TicketPhoto {
  id: number
  storage_path: string
  caption: string | null
  created_at: string
}

export default function TicketDetailModal({
  ticket,
  photos,
  onClose,
}: {
  ticket: Ticket
  photos: TicketPhoto[]
  onClose: () => void
}) {
  const statusColors = {
    open: 'bg-blue-100 text-blue-700',
    assigned: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-700',
  }

  const allPhotos = [
    ...(ticket.image_url ? [{ id: 0, storage_path: ticket.image_url, caption: 'Main image', created_at: ticket.created_at }] : []),
    ...photos
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <QrCode size={20} className="text-slate-400" />
              <h2 className="text-2xl font-bold text-slate-900 font-mono">{ticket.fridge_code}</h2>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${statusColors[ticket.status as keyof typeof statusColors]}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          {ticket.leads && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  <span className="text-slate-700">
                    {ticket.leads.customer_name || 'Unknown Customer'}
                  </span>
                </div>
                {ticket.leads.villages && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="text-slate-700">{ticket.leads.villages.name}</span>
                  </div>
                )}
                <div className="text-slate-500 font-mono text-xs">
                  WhatsApp: {maskPhoneNumber(ticket.leads.whatsapp_id)}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {ticket.description && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-700 text-sm">{ticket.description}</p>
            </div>
          )}

          {/* Photos */}
          {allPhotos.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Image size={18} />
                Photos ({allPhotos.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {allPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.storage_path}
                      alt={photo.caption || 'Ticket photo'}
                      className="w-full h-48 object-cover rounded-lg border border-slate-200"
                    />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 rounded-b-lg">
                        {photo.caption}
                      </div>
                    )}
                    <a
                      href={photo.storage_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors rounded-lg"
                    >
                      <Image className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {ticket.scheduled_for && (
              <div>
                <div className="text-slate-500 mb-1">Scheduled</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar size={14} />
                  {new Date(ticket.scheduled_for).toLocaleDateString()}
                </div>
              </div>
            )}
            {ticket.profiles && (
              <div>
                <div className="text-slate-500 mb-1">Assigned To</div>
                <div className="flex items-center gap-2 text-slate-700">
                  <User size={14} />
                  {ticket.profiles.full_name || 'Unassigned'}
                </div>
              </div>
            )}
            <div>
              <div className="text-slate-500 mb-1">Created</div>
              <div className="text-slate-700">
                {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
              </div>
            </div>
            {ticket.completed_at && (
              <div>
                <div className="text-slate-500 mb-1">Completed</div>
                <div className="text-slate-700">
                  {formatDistanceToNow(new Date(ticket.completed_at), { addSuffix: true })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
