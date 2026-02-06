'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { MapPin, MessageSquare, GripVertical, Ticket, Plus } from 'lucide-react'
import { createTicketFromLead } from '../tickets/actions'
import { maskPhoneNumber } from '@/utils/data-masking'

type LeadStatus = 'new' | 'qualified' | 'converted' | 'archived'

interface Lead {
  id: number
  whatsapp_id: string
  customer_name: string | null
  phone_number: string | null
  village_id: number | null
  status: LeadStatus
  notes: string | null
  created_at: string
  consent_given?: boolean
  consent_date?: string
  villages?: { name: string } | null
}

const COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'new', title: 'New', color: 'bg-blue-50 border-blue-200' },
  { id: 'qualified', title: 'Qualified', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'converted', title: 'Converted', color: 'bg-green-50 border-green-200' },
  { id: 'archived', title: 'Archived', color: 'bg-slate-50 border-slate-200' },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const supabase = createClient()

  const loadLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          villages:village_id (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadLeads()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          loadLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadLeads, supabase])

  async function updateLeadStatus(leadId: number, newStatus: LeadStatus) {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId)

      if (error) throw error
      
      // Optimistic update
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ))
    } catch (error) {
      console.error('Error updating lead status:', error)
      // Reload on error
      loadLeads()
    }
  }

  function handleDragStart(lead: Lead) {
    setDraggedLead(lead)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, targetStatus: LeadStatus) {
    e.preventDefault()
    if (draggedLead && draggedLead.status !== targetStatus) {
      updateLeadStatus(draggedLead.id, targetStatus)
    }
    setDraggedLead(null)
  }

  const leadsByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter(lead => lead.status === col.id)
    return acc
  }, {} as Record<LeadStatus, Lead[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leads Management</h1>
        <p className="text-slate-500">Manage and track leads from WhatsApp conversations</p>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className={`rounded-lg border-2 ${column.color} p-4 min-h-[500px]`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">{column.title}</h2>
              <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded-full">
                {leadsByStatus[column.id]?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {leadsByStatus[column.id]?.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onDragStart={() => handleDragStart(lead)}
                  onCreateTicket={async (type) => {
                    const result = await createTicketFromLead(lead.id, type)
                    if (result.success) {
                      alert(`Ticket created: ${result.fridgeCode}`)
                      loadLeads()
                    } else {
                      alert(result.error || 'Failed to create ticket')
                    }
                  }}
                />
              ))}

              {(!leadsByStatus[column.id] || leadsByStatus[column.id].length === 0) && (
                <div className="text-sm text-slate-400 text-center py-8">
                  No leads in this column
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LeadCard({ 
  lead, 
  onDragStart,
  onCreateTicket 
}: { 
  lead: Lead
  onDragStart: () => void
  onCreateTicket: (type: 'sell' | 'repair') => Promise<void>
}) {
  const [showTicketMenu, setShowTicketMenu] = useState(false)

  // Format creation time
  const timeAgo = formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
  
  // Format consent
  const hasConsent = lead.consent_given === true

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${hasConsent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
           {hasConsent ? 'CONSENTED' : 'NO CONSENT'}
        </span>
        <GripVertical size={16} className="text-slate-400" />
      </div>

      <div className="mb-2">
        <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-1">
          {lead.customer_name || 'Unknown Customer'}
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MessageSquare size={12} className="text-green-600" />
          <span className="font-mono">{maskPhoneNumber(lead.whatsapp_id)}</span>
        </div>
      </div>

      {lead.villages && (
        <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
          <MapPin size={12} />
          <span>{lead.villages.name}</span>
        </div>
      )}

      {lead.notes && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2 bg-slate-50 p-1.5 rounded border border-slate-100 italic">
          &quot;{lead.notes}&quot;
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="text-[10px] text-slate-400">
          {timeAgo}
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowTicketMenu(!showTicketMenu)
            }}
            className="flex items-center gap-1 text-xs text-brand-blue hover:text-brand-blue/80 font-medium px-2 py-1 rounded hover:bg-blue-50"
          >
            <Plus size={12} />
            <Ticket size={12} />
          </button>
          {showTicketMenu && (
            <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[120px] z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateTicket('sell')
                  setShowTicketMenu(false)
                }}
                className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-50 rounded"
              >
                Create Sell Ticket
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateTicket('repair')
                  setShowTicketMenu(false)
                }}
                className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-50 rounded"
              >
                Create Repair Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
