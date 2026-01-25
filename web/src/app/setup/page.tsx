export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-2xl w-full p-8 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-red-500 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-4">!</div>
          <h1 className="text-2xl font-bold text-slate-900">Setup Required</h1>
          <p className="text-slate-500 mt-2">Environment configuration is missing or invalid</p>
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Missing Configuration</h3>
            <p className="text-yellow-700 text-sm">
              Your Supabase environment variables are not configured or contain placeholder values.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Setup Instructions:</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                <div>
                  <p className="font-medium">Create a Supabase project</p>
                  <p className="text-slate-600">Visit <a href="https://supabase.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">supabase.com</a> and create a new project</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                <div>
                  <p className="font-medium">Get your project credentials</p>
                  <p className="text-slate-600">Go to Project Settings → API to find your URL and anon key</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                <div>
                  <p className="font-medium">Configure SMS provider (optional)</p>
                  <p className="text-slate-600">For phone authentication, add Twilio credentials</p>
                  <div className="mt-2 bg-slate-100 rounded p-3 font-mono text-xs">
                    <div>TWILIO_ACCOUNT_SID=your-twilio-sid</div>
                    <div>TWILIO_AUTH_TOKEN=your-twilio-token</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                <div>
                  <p className="font-medium">Update your .env.local file</p>
                  <div className="mt-2 bg-slate-100 rounded p-3 font-mono text-xs">
                    <div>NEXT_PUBLIC_SUPABASE_URL=your-project-url</div>
                    <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</div>
                    <div>NEXT_PUBLIC_SITE_URL=http://localhost:3000</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">5</span>
                <div>
                  <p className="font-medium">Restart the development server</p>
                  <p className="text-slate-600">Run <code className="bg-slate-100 px-1 rounded">npm run dev</code> again</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Security Notice</h3>
            <p className="text-red-700 text-sm">
              Never commit real credentials to version control. The .env.local file is already in .gitignore.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}