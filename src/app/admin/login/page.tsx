'use client'
// src/app/admin/login/page.tsx
// Full executive / admin login — role-aware, session-cookie-based

import { useState, useRef } from 'react'
import { useRouter }        from 'next/navigation'
import Image                from 'next/image'
import { clsx }             from 'clsx'

type Step    = 'phone' | 'otp' | 'denied'
type ToastT  = { type: 'success'|'error'|'warning'; msg: string } | null

const ROLE_META: Record<string, { label: string; icon: string; desc: string; color: string }> = {
  GOVERNOR_EXEC: { label: "Governor's Office",  icon: '🏛️', desc: 'Full executive access',          color: '#01411C' },
  COUNTY_ADMIN:  { label: 'County Admin',        icon: '⚙️',  desc: 'Administrative access',         color: '#2563eb' },
  MCA:           { label: 'MCA / Ward Officer',  icon: '🏅', desc: 'Ward-level proposals & reports', color: '#6E473B' },
}

export default function AdminLoginPage() {
  const router = useRouter()

  const [step,       setStep]       = useState<Step>('phone')
  const [phone,      setPhone]      = useState('')
  const [otp,        setOtp]        = useState(['','','','','',''])
  const [loading,    setLoading]    = useState(false)
  const [toast,      setToast]      = useState<ToastT>(null)
  const [detectedRole, setDetectedRole] = useState<string | null>(null)
  const [userName,   setUserName]   = useState('')
  const [devOtp,     setDevOtp]     = useState('')

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const showToast = (type: ToastT['type'], msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Step 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\s/g, '')
    if (!cleaned) { showToast('warning', 'Enter your registered phone number'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phoneNumber: cleaned, fullName: 'Admin User', nationalId: '00000000' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send code')
      setStep('otp')
      if (data._dev_otp) {
        setDevOtp(data._dev_otp)
        // Auto-fill OTP boxes in dev
        const digits = String(data._dev_otp).split('')
        setOtp(digits)
        showToast('success', `Dev mode: OTP auto-filled — ${data._dev_otp}`)
      } else {
        showToast('success', `Verification code sent to ${cleaned}`)
      }
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  // ── Step 2: Verify OTP + create session ───────────────────
  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) { showToast('warning', 'Enter all 6 digits'); return }
    setLoading(true)
    try {
      const cleaned = phone.replace(/\s/g, '')

      // Verify OTP
      const verRes  = await fetch('/api/auth/otp', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phoneNumber: cleaned, otpCode: code }),
      })
      const verData = await verRes.json()
      if (!verRes.ok) throw new Error(verData.error ?? 'Invalid code')

      const { role, fullName } = verData.data ?? {}

      // Check role is admin-level
      if (!['COUNTY_ADMIN', 'GOVERNOR_EXEC', 'MCA'].includes(role)) {
        setStep('denied')
        setDetectedRole(role)
        return
      }

      setDetectedRole(role)
      setUserName(fullName ?? '')

      // Create server session (sets HttpOnly cookie)
      const sessRes  = await fetch('/api/auth/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phoneNumber: cleaned }),
      })
      const sessData = await sessRes.json()
      if (!sessRes.ok) throw new Error(sessData.error ?? 'Session creation failed')

      showToast('success', `Welcome back, ${fullName ?? 'Admin'}!`)
      setTimeout(() => router.push('/admin'), 800)
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Verification failed')
    } finally { setLoading(false) }
  }

  // ── OTP box key handling ───────────────────────────────────
  const handleOtpKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next  = [...otp]
    next[idx]   = digit
    setOtp(next)
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-meruGreen via-[#025c27] to-[#01411C] flex flex-col">

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-sm w-[calc(100vw-2rem)] animate-slide-up',
          toast.type === 'success' ? 'bg-green-800' : toast.type === 'error' ? 'bg-red-800' : 'bg-amber-700'
        )}>
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}</span>
          <p className="flex-1">{toast.msg}</p>
        </div>
      )}

      {/* Header strip */}
      <div className="bg-black/20 border-b border-white/10 py-3 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
            ← Back to portal
          </a>
          <span className="text-white/40 text-xs">baiteconnect.meru.go.ke</span>
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/meru-logo.png"
                  alt="County Government of Meru"
                  width={88}
                  height={88}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-meruGold rounded-full flex items-center justify-center text-meruGreen text-xs font-bold shadow-lg">
                🔐
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Executive Access</h1>
            <p className="text-white/60 text-sm">BaiteConnect Admin Portal</p>
            <p className="text-white/40 text-xs mt-1">County Government of Meru, Kenya</p>
          </div>

          {/* Role badges */}
          <div className="flex gap-2 justify-center mb-6 flex-wrap">
            {Object.entries(ROLE_META).map(([role, meta]) => (
              <div key={role}
                className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs text-white/80">
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </div>
            ))}
          </div>

          {/* ── Card ───────────────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Card header bar */}
            <div className="bg-gradient-to-r from-meruGreen to-[#025c27] px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-meruGold animate-pulse" />
                <p className="text-white/90 text-sm font-medium">
                  {step === 'phone'  && 'Step 1 of 2 — Enter your registered number'}
                  {step === 'otp'    && 'Step 2 of 2 — Enter verification code'}
                  {step === 'denied' && 'Access Denied'}
                </p>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">

              {/* ── STEP 1: Phone ─────────────────────────── */}
              {step === 'phone' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone number registered with Meru County
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📱</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                        placeholder="+254 7XX XXX XXX"
                        className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm outline-none focus:border-meruGreen transition-colors font-mono"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      A 6-digit SMS code will be sent to this number via Africa&apos;s Talking.
                    </p>
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading || !phone.trim()}
                    className="w-full bg-meruGreen text-white font-bold py-3.5 rounded-2xl hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[52px]"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : '📲'}
                    {loading ? 'Sending…' : 'Send verification code'}
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-100" />
                    <span className="text-xs text-gray-400">Authorised personnel only</span>
                    <div className="flex-1 border-t border-gray-100" />
                  </div>

                  {/* Role access info */}
                  <div className="space-y-2">
                    {Object.entries(ROLE_META).map(([role, meta]) => (
                      <div key={role} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <span className="text-lg">{meta.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-700">{meta.label}</p>
                          <p className="text-xs text-gray-400">{meta.desc}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── STEP 2: OTP ───────────────────────────── */}
              {step === 'otp' && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-meruGreen mb-0.5">📱 Code sent</p>
                    <p className="text-sm text-gray-600">
                      A 6-digit code was sent to <strong className="font-mono">{phone}</strong>.
                      Valid for 10 minutes.
                    </p>
                    {devOtp && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2 font-mono">
                        🔧 Dev mode: {devOtp}
                      </p>
                    )}
                  </div>

                  {/* OTP boxes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                      Enter 6-digit verification code
                    </label>
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {otp.map((d, i) => (
                        <input
                          key={i}
                          ref={el => { inputRefs.current[i] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e  => handleOtpKey(i, e)}
                          className={clsx(
                            'w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all',
                            'focus:border-meruGold focus:ring-2 focus:ring-meruGold/20',
                            d ? 'border-meruGreen bg-green-50 text-meruGreen' : 'border-gray-200 bg-white text-gray-800'
                          )}
                          style={{ height: 52 }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={loading || otp.join('').length < 6}
                    className="w-full bg-meruGold text-meruGreen font-bold py-3.5 rounded-2xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[52px] shadow-lg"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-meruGreen" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : '🔓'}
                    {loading ? 'Verifying…' : 'Access Admin Dashboard'}
                  </button>

                  <button
                    onClick={() => { setStep('phone'); setOtp(['','','','','','']); setDevOtp('') }}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                  >
                    ← Use a different number
                  </button>
                </>
              )}

              {/* ── DENIED ────────────────────────────────── */}
              {step === 'denied' && (
                <div className="text-center py-4 space-y-4">
                  <div className="text-5xl">🚫</div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">Access Denied</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Your account has the <strong>{detectedRole ?? 'CITIZEN'}</strong> role,
                      which does not have access to the admin console.
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left">
                    If you believe this is an error, contact the County ICT Department to request an administrative role assignment. Your phone number must be registered as a COUNTY_ADMIN, GOVERNOR_EXEC, or MCA in the system.
                  </div>
                  <button
                    onClick={() => { setStep('phone'); setPhone(''); setOtp(['','','','','','']) }}
                    className="w-full bg-meruGreen text-white font-semibold py-3 rounded-2xl hover:bg-green-900 transition-colors text-sm"
                  >
                    Try a different number
                  </button>
                  <a href="/" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    ← Return to public portal
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-white/30 text-xs mt-6 leading-relaxed">
            Restricted to authorised County Government of Meru officials only.<br/>
            All access attempts are logged in the immutable audit trail.
          </p>
        </div>
      </div>

      {/* Bottom compliance bar */}
      <div className="bg-black/30 border-t border-white/10 py-3 px-6">
        <p className="text-center text-white/30 text-xs">
          PFM Act 2012 · Constitution of Kenya Art. 201 · Kenya Data Protection Act 2019
        </p>
      </div>
    </div>
  )
}
