import { login, signup } from './actions'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams?.error
  const message = searchParams?.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
       <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-slate-100">
          <div className="text-center mb-8">
             <div className="w-12 h-12 bg-brand-blue rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-4">F</div>
             <h1 className="text-2xl font-bold text-slate-900">Sign in to FridgeOps</h1>
             <p className="text-slate-500 mt-2">Enter your credentials to access the dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {decodeURIComponent(error)}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              {decodeURIComponent(message)}
            </div>
          )}

          <form className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email</label>
               <input 
                 id="email" 
                 name="email" 
                 type="email" 
                 required 
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition text-slate-900 placeholder:text-slate-400"
                 placeholder="admin@fridge.business"
                />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Password</label>
               <input 
                 id="password" 
                 name="password" 
                 type="password" 
                 required 
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition text-slate-900 placeholder:text-slate-400"
                 placeholder="••••••••"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
                <button formAction={login} className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold rounded-lg transition shadow-sm hover:shadow">
                  Sign In
                </button>
                 <button formAction={signup} className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg transition">
                  Sign Up
                </button>
            </div>
          </form>
       </div>
    </div>
  )
}
