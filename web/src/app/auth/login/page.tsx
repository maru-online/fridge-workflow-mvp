import { login, signup, signInWithGoogle, signInWithApple } from './actions'

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams?.error

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

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <form action={signInWithGoogle}>
              <button 
                type="submit"
                className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition flex items-center justify-center gap-3 shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </form>
            
            <div className="text-xs text-slate-500 text-center">
              <a href="/auth/debug" className="underline">Debug OAuth</a>
            </div>

            <form action={signInWithApple}>
              <button 
                type="submit"
                className="w-full py-2.5 px-4 bg-black text-white hover:bg-gray-900 font-medium rounded-lg transition flex items-center justify-center gap-3 shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with email</span>
            </div>
          </div>

          <form className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email</label>
               <input 
                 id="email" 
                 name="email" 
                 type="email" 
                 required 
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition"
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
                 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition"
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
