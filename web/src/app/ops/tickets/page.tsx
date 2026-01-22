'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { Ticket, User, MapPin, Calendar, QrCode, CheckCircle, Clock, AlertCircle, Image, X } from 'lucide-react'
import { assignTicket, updateTicketStatus } from './actions'
import TicketDetailModal from './TicketDetailModal'

type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'closed'

interface Ticket {
  id: string
  fridge_code: string
  category: string
  type: 'sell' | 'repair' | 'maintenance'
  status: TicketStatus
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

const COLUMNS: { id: TicketStatus; title: string; color: string; icon: React.ReactNode }[] = [
  { id: 'open', title: 'Open', color: 'bg-blue-50 border-blue-200', icon: <AlertCircle size={16} /> },
  { id: 'assigned', title: 'Assigned', color: 'bg-yellow-50 border-yellow-200', icon: <User size={16} /> },
  { id: 'in_progress', title: 'In Progress', color: 'bg-orange-50 border-orange-200', icon: <Clock size={16} /> },
  { id: 'completed', title: 'Completed', color: 'bg-green-50 border-green-200', icon: <CheckCircle size={16} /> },
  { id: 'closed', title: 'Closed', color: 'bg-slate-50 border-slate-200', icon: <Ticket size={16} /> },
]

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [runners, setRunners] = useState<{ id: string; full_name: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [ticketPhotos, setTicketPhotos] = useState<{ id: number; storage_path: string; caption: string | null; created_at: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadTickets()
    loadRunners()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          loadTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadTickets() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          leads:lead_id (
            customer_name,
            whatsapp_id,
            villages:village_id (name)
          ),
          profiles:assigned_to (full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTicketPhotos(ticketId: string) {
    try {
      const { data, error } = await supabase
        .from('ticket_photos')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTicketPhotos(data || [])
    } catch (error) {
      console.error('Error loading ticket photos:', error)
      setTicketPhotos([])
    }
  }

  function handleTicketClick(ticket: Ticket) {
    setSelectedTicket(ticket)
    loadTicketPhotos(ticket.id)
  }

  async function loadRunners() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'runner')

      if (error) throw error
      setRunners(data || [])
    } catch (error) {
      console.error('Error loading runners:', error)
    }
  }

  async function handleAssignTicket(ticketId: string, runnerId: string) {
    const result = await assignTicket(ticketId, runnerId)
    if (result.success) {
      loadTickets()
    } else {
      alert(result.error || 'Failed to assign ticket')
    }
  }

  async function handleStatusChange(ticketId: string, newStatus: TicketStatus) {
    const result = await updateTicketStatus(ticketId, newStatus)
    if (result.success) {
      loadTickets()
    } else {
      alert(result.error || 'Failed to update ticket status')
    }
  }

  function handleDragStart(ticket: Ticket) {
    setDraggedTicket(ticket)
  }

  function handleDragOver(e: React.DragEvent, status: TicketStatus) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, targetStatus: TicketStatus) {
    e.preventDefault()
    if (draggedTicket && draggedTicket.status !== targetStatus) {
      handleStatusChange(draggedTicket.id, targetStatus)
    }
    setDraggedTicket(null)
  }

  const ticketsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tickets.filter(ticket => ticket.status === col.id)
    return acc
  }, {} as Record<TicketStatus, Ticket[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading tickets...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tickets Management</h1>
        <p className="text-slate-500">Manage and track all tickets and jobs</p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className={`rounded-lg border-2 ${column.color} p-4 min-h-[600px]`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {column.icon}
                <h2 className="font-semibold text-slate-800">{column.title}</h2>
              </div>
              <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded-full">
                {ticketsByStatus[column.id]?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {ticketsByStatus[column.id]?.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  runners={runners}
                  onDragStart={() => handleDragStart(ticket)}
                  onAssign={(runnerId) => handleAssignTicket(ticket.id, runnerId)}
                  onClick={() => handleTicketClick(ticket)}
                />
              ))}

              {(!ticketsByStatus[column.id] || ticketsByStatus[column.id].length === 0) && (
                <div className="text-sm text-slate-400 text-center py-8">
                  No tickets in this column
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TicketCard({ 
  ticket, 
  runners, 
  onDragStart,
  onAssign,
  onClick
}: { 
  ticket: Ticket
  runners: { id: string; full_name: string | null }[]
  onDragStart: () => void
  onAssign: (runnerId: string) => void
  onClick: () => void
}) {
  const [showAssignMenu, setShowAssignMenu] = useState(false)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={12} className="text-slate-400" />
            <h3 className="font-mono font-semibold text-slate-900 text-sm">
              {ticket.fridge_code}
            </h3>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            ticket.type === 'sell' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-orange-100 text-orange-700'
          }`}>
            {ticket.type.toUpperCase()}
          </span>
        </div>
      </div>

      {ticket.leads && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-slate-600 font-medium">
            {ticket.leads.customer_name || 'Unknown Customer'}
          </div>
          {ticket.leads.villages && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={10} />
              <span>{ticket.leads.villages.name}</span>
            </div>
          )}
        </div>
      )}

      {ticket.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mt-2">
          {ticket.description}
        </p>
      )}

      {ticket.image_url && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Image size={10} />
          <span>Has photo</span>
        </div>
      )}

      {ticket.assigned_to ? (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
          <User size={10} />
          <span>{ticket.profiles?.full_name || 'Assigned'}</span>
        </div>
      ) : (
        <div className="mt-2 relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowAssignMenu(!showAssignMenu)
            }}
            className="text-xs text-brand-blue hover:text-brand-blue/80 font-medium"
          >
            Assign Runner
          </button>
          {showAssignMenu && (
            <div className="absolute z-10 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[150px]">
              {runners.length === 0 ? (
                <div className="text-xs text-slate-500 py-2">No runners available</div>
              ) : (
                runners.map((runner) => (
                  <button
                    key={runner.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAssign(runner.id)
                      setShowAssignMenu(false)
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-50 rounded"
                  >
                    {runner.full_name || 'Unnamed Runner'}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {ticket.scheduled_for && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Calendar size={10} />
          <span>{new Date(ticket.scheduled_for).toLocaleDateString()}</span>
        </div>
      )}

      <div className="text-[10px] text-slate-400 mt-2">
        {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
      </div>
    </div>
  )
}
