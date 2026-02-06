import { verifyPhoneOtp, signUpWithPhone } from '../login/actions'

export default async function VerifyPage(props: { searchParams: Promise<{ phone?: string; error?: string }> }) {
  const searchParams = await props.searchParams
  const phone = searchParams?.phone
  const error = searchParams?.error

  if (!phone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-slate-100">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-4">!</div>
            <h1 className="text-2xl font-bold text-slate-900">Invalid Request</h1>
            <p className="text-slate-500 mt-2">No phone number provided</p>
            <a href="/auth/login" className="mt-4 inline-block text-blue-600 hover:underline">Back to Login</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-4">📱</div>
          <h1 className="text-2xl font-bold text-slate-900">Verify Your Phone</h1>
          <p className="text-slate-500 mt-2">Enter the 6-digit code sent to</p>
          <p className="text-slate-900 font-medium">{decodeURIComponent(phone)}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        <form className="space-y-6">
          <input type="hidden" name="phone" value={phone} />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="otp">Verification Code</label>
            <input 
              id="otp" 
              name="otp" 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required 
              className="w-full px-4 py-3 text-center text-2xl font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              placeholder="123456"
              autoComplete="one-time-code"
            />
          </div>
          
          <button 
            formAction={verifyPhoneOtp} 
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-sm hover:shadow"
          >
            Verify Code
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 mb-2">Didn&apos;t receive the code?</p>
          <form action={signUpWithPhone} className="inline">
            <input type="hidden" name="phone" value={phone} />
            <button className="text-green-600 hover:text-green-700 font-medium text-sm hover:underline">
              Resend Code
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-slate-600 hover:text-slate-700 text-sm hover:underline">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
