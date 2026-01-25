export default async function AuthError(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams?.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-red-500 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-4">!</div>
          <h1 className="text-2xl font-bold text-slate-900">Authentication Error</h1>
          <p className="text-slate-500 mt-2">There was a problem with your authentication</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        <div className="text-center">
          <a 
            href="/auth/login" 
            className="inline-block px-6 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold rounded-lg transition"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}