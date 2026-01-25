import { login, signup, signInWithGoogle, signInWithApple } from './actions'

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




          <div className="grid grid-cols-2 gap-4 mb-6">
            <form action={signInWithGoogle}>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </form>
            <form action={signInWithApple}>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.38-1.09-.54-2.08-.53-3.2 0-1.44.7-2.2.53-3.14-.54-1.25-1.44-2.18-3.87-1.12-5.71.95-1.63 2.77-1.92 3.65-1.87.97.05 1.76.65 2.37.65.6 0 1.5-.67 2.65-.62 1.08.05 2.05.5 2.65 1.25-2.39 1.15-2.07 4.1.2 5.21-.29.83-.72 1.65-1.22 2.25zM12.03 7.25c.57-1.39 2.02-2.29 3.19-2.25.1.7.05 1.44-.3 2.15-.52 1.07-1.87 1.95-3.12 1.85-.15-.75-.15-1.35.23-1.75z" />
                </svg>
                Apple
              </button>
            </form>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with email</span>
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
