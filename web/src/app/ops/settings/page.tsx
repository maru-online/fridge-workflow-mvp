'use client'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage application settings and configurations</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">System Notification</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
            System notifications and operational configurations will be available here.
        </p>
      </div>
    </div>
  )
}
