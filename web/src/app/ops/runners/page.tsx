'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User, CheckCircle, Clock } from 'lucide-react'

interface Runner {
  id: string
  full_name: string | null
  phone_number: string | null
  role: string
  created_at: string
  assigned_tickets_count?: number
  completed_tickets_count?: number
}

export default function RunnersPage() {
  const [runners, setRunners] = useState<Runner[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadRunners = useCallback(async () => {
    try {
      // Get all runners
      const { data: runnersData, error: runnersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'runner')
        .order('created_at', { ascending: false })

      if (runnersError) throw runnersError

      // Get ticket counts for each runner
      const runnersWithCounts = await Promise.all(
        (runnersData || []).map(async (runner) => {
          const { count: assignedCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', runner.id)
            .in('status', ['open', 'assigned', 'in_progress'])

          const { count: completedCount } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', runner.id)
            .eq('status', 'completed')

          return {
            ...runner,
            assigned_tickets_count: assignedCount || 0,
            completed_tickets_count: completedCount || 0,
          }
        })
      )

      setRunners(runnersWithCounts)
    } catch (error) {
      console.error('Error loading runners:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadRunners()
  }, [loadRunners])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading runners...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Runner Management</h1>
        <p className="text-slate-500">View and manage field runners</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {runners.length > 0 ? (
          runners.map((runner) => (
            <RunnerCard key={runner.id} runner={runner} />
          ))
        ) : (
          <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center">
            <User className="mx-auto text-slate-400 mb-4" size={48} />
            <p className="text-slate-500 mb-2">No runners found</p>
            <p className="text-sm text-slate-400">Runners will appear here once they sign up.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RunnerCard({ runner }: { runner: Runner }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
            <User className="text-brand-blue" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {runner.full_name || 'Unnamed Runner'}
            </h3>
            {runner.phone_number && (
              <p className="text-sm text-slate-500">{runner.phone_number}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={16} />
            <span className="text-sm font-medium text-slate-700">Active Jobs</span>
          </div>
          <span className="text-lg font-bold text-blue-600">
            {runner.assigned_tickets_count || 0}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600" size={16} />
            <span className="text-sm font-medium text-slate-700">Completed</span>
          </div>
          <span className="text-lg font-bold text-green-600">
            {runner.completed_tickets_count || 0}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Joined {new Date(runner.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
