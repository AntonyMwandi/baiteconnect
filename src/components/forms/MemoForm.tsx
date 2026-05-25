'use client'
// src/components/forms/MemoForm.tsx
// 3-step verified memorandum submission form

import { useState, useRef, useCallback } from 'react'
import { useLanguage }   from '@/lib/language-context'
import { Button, Input, Select, Textarea, StepIndicator, Card, Toast } from '@/components/ui'
import BudgetSlider      from './BudgetSlider'
import { clsx }          from 'clsx'

const SUB_COUNTIES = [
  'Igembe North', 'Igembe Central', 'Igembe South',
  'Tigania West', 'Tigania East', 'Central Imenti',
  'North Imenti', 'South Imenti', 'Buuri',
]

const ALL_WARDS: Record<string, string[]> = {
  'Igembe North':   ['Antuambui','Ntunene','Antubetwe Boreine','Muungaa','Lare'],
  'Igembe Central': ['Athwana','Akachiu','Kanuni','Kiegoi/Antubochiu','Maua'],
  'Igembe South':   ["Akirang'ondu",'Athiru Gaiti','Ragati','Mbeu','Kiengu'],
  'Tigania West':   ['Mbogoni','Nkomo','Kibirichia','Kianjai','Nturuba'],
  'Tigania East':   ['Ntima East','Ntima West','Muthara','Karama','Micro','Mwiteria'],
  'Central Imenti': ['Abothuguchi Central','Abothuguchi West','Kiagu','Abogeta East','Abogeta West'],
  'North Imenti':   ['Municipality','Ntima','Nkuene','Timau','Githongo'],
  'South Imenti':   ['Igoji East','Igoji West','Mitunguu','Nkuene South'],
  'Buuri':          ['Ruiri/Rwarera','Kisima','Kiirua/Naari','Ruiri','Nyaki West'],
}

const SECTORS = [
  { value: 'Health',                 icon: '🏥' },
  { value: 'Agriculture',            icon: '🌾' },
  { value: 'Roads & Infrastructure', icon: '🛣️' },
  { value: 'Water & Environment',    icon: '💧' },
  { value: 'General Public Service', icon: '🏛️' },
]

interface SliderChoices {
  health: number; agriculture: number; roads: number
  water: number;  publicService: number
}

interface FormState {
  fullName: string; nationalId: string; phoneNumber: string
  subCounty: string; wardId: string
  sector: string; memoText: string; attachmentUrl: string
  sliders: SliderChoices
  lat: number; lng: number
}

interface FormErrors { [key: string]: string }

const DEFAULT_SLIDERS: SliderChoices = {
  health: 40, agriculture: 20, roads: 15, water: 15, publicService: 10
}

type ToastState = { type: 'success'|'error'|'warning'|'info'; message: string } | null

export default function MemoForm({ wards }: { wards: { id: number; wardName: string; subCounty: string }[] }) {
  const { t, lang } = useLanguage()
  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState<FormState>({
    fullName:'', nationalId:'', phoneNumber:'',
    subCounty:'', wardId:'',
    sector:'', memoText:'', attachmentUrl:'',
    sliders: DEFAULT_SLIDERS, lat: 0, lng: 0,
  })
  const [errors, setErrors]   = useState<FormErrors>({})
  const [otp, setOtp]         = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast]     = useState<ToastState>(null)
  const [submitted, setSubmitted] = useState<{ referenceCode: string; wardName: string; sector: string } | null>(null)
  const fileRef               = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')

  const set = (key: keyof FormState, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }))

  const filteredWards = form.subCounty
    ? (ALL_WARDS[form.subCounty] ?? []).map(name => {
        const w = wards.find(w => w.wardName === name && w.subCounty === form.subCounty)
        return w ? { value: String(w.id), label: w.wardName } : { value: name, label: name }
      })
    : []

  // Request geolocation
  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => { set('lat', pos.coords.latitude); set('lng', pos.coords.longitude) },
      ()  => console.warn('Geolocation denied')
    )
  }, [])

  // Step 1 validation
  const validateStep1 = (): boolean => {
    const e: FormErrors = {}
    if (!form.fullName.trim() || form.fullName.trim().length < 3)
      e.fullName = t('validation', 'required')
    if (!/^\d{7,8}$/.test(form.nationalId.trim()))
      e.nationalId = t('validation', 'invalidId')
    if (!/^(\+254|0)[17]\d{8}$/.test(form.phoneNumber.replace(/\s/g, '')))
      e.phoneNumber = t('validation', 'invalidPhone')
    if (!form.subCounty) e.subCounty = t('validation', 'required')
    if (!form.wardId)    e.wardId    = t('validation', 'required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Step 3 validation
  const validateStep3 = (): boolean => {
    const e: FormErrors = {}
    if (!form.sector)                e.sector   = t('validation', 'required')
    if (form.memoText.trim().length < 30) e.memoText = t('validation', 'memoTooShort')
    const total = Object.values(form.sliders).reduce((a, b) => a + b, 0)
    if (total !== 100)               e.sliders  = t('validation', 'balanceError')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Send OTP
  const handleSendOtp = async () => {
    if (!validateStep1()) return
    requestGeo()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: form.phoneNumber,
          fullName:    form.fullName,
          nationalId:  form.nationalId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send OTP')
      setOtpSent(true)
      // In dev, auto-fill OTP
      if (data._dev_otp) setOtp(data._dev_otp)
      setStep(1)
    } catch (err: unknown) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send OTP' })
    } finally { setLoading(false) }
  }

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setErrors({ otp: 'Enter the 6-digit code' })
      return
    }
    setLoading(true)
    try {
      const phone = form.phoneNumber.replace(/\s/g, '').replace(/^0/, '+254')
      const res   = await fetch('/api/auth/otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, otpCode: otp }),
      })
      const data  = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Verification failed')
      setOtpVerified(true)
      setErrors({})
    } catch (err: unknown) {
      setErrors({ otp: err instanceof Error ? err.message : 'Invalid code' })
    } finally { setLoading(false) }
  }

  // Final submit
  const handleSubmit = async () => {
    if (!validateStep3()) return
    setLoading(true)
    try {
      const phone   = form.phoneNumber.replace(/\s/g, '').replace(/^0/, '+254')
      const wardObj = wards.find(w => String(w.id) === form.wardId)
      if (!wardObj) throw new Error('Invalid ward')

      const res = await fetch('/api/memoranda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:      form.fullName,
          nationalId:    form.nationalId,
          phoneNumber:   phone,
          wardId:        parseInt(form.wardId, 10),
          fiscalYear:    '2026/2027',
          sectorCategory:form.sector,
          writtenText:   form.memoText,
          attachmentUrl: form.attachmentUrl || undefined,
          sliderChoices: form.sliders,
          latitude:      form.lat || -0.046,
          longitude:     form.lng || 37.649,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Submission failed')
      setSubmitted({ referenceCode: data.data.referenceCode, wardName: wardObj.wardName, sector: form.sector })
    } catch (err: unknown) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Submission failed. Please try again.' })
    } finally { setLoading(false) }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    // In production: upload to storage bucket, set attachmentUrl
    // For now, we store filename as placeholder URL
    set('attachmentUrl', `https://uploads.baiteconnect.meru.go.ke/${file.name}`)
  }

  const STEP_LABELS = [t('form', 'step1'), t('form', 'step2'), t('form', 'step3')]

  if (submitted) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto animate-fade-in">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-meruGreen mb-2">{t('form', 'success')}</h2>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{t('form', 'successMsg')}</p>
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-6 text-left">
          <p className="text-xs text-gray-500 mb-0.5">{t('form', 'reference')}</p>
          <p className="text-lg font-mono font-bold text-meruGreen">{submitted.referenceCode}</p>
          <p className="text-xs text-gray-500 mt-2">Ward: <strong>{submitted.wardName}</strong></p>
          <p className="text-xs text-gray-500">Sector: <strong>{submitted.sector}</strong></p>
        </div>
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            setSubmitted(null); setStep(0)
            setForm({ fullName:'', nationalId:'', phoneNumber:'', subCounty:'', wardId:'',
              sector:'', memoText:'', attachmentUrl:'', sliders: DEFAULT_SLIDERS, lat:0, lng:0 })
            setOtp(''); setOtpSent(false); setOtpVerified(false)
          }}
        >
          Submit another memo
        </Button>
      </Card>
    )
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <Card className="overflow-visible">
        {/* Form header */}
        <div className="bg-meru-header px-5 pt-5 pb-6">
          <p className="text-xs text-white/60 uppercase tracking-widest mb-1">{t('app', 'fiscalYear')}</p>
          <h2 className="text-lg font-bold text-white mb-4">{t('form', 'title')}</h2>
          <StepIndicator steps={STEP_LABELS} current={step} />
        </div>

        <div className="p-5 space-y-5">
          {/* ── STEP 0: Identity & Ward ──────────────────────── */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <Input
                label={t('form', 'fullName')}
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
                placeholder="e.g. Mary Njiru Gitonga"
                error={errors.fullName}
                required
              />
              <Input
                label={t('form', 'nationalId')}
                value={form.nationalId}
                onChange={e => set('nationalId', e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 12345678"
                maxLength={8}
                error={errors.nationalId}
                required
              />
              <Input
                label={t('form', 'phone')}
                value={form.phoneNumber}
                onChange={e => set('phoneNumber', e.target.value)}
                placeholder="+254 7XX XXX XXX"
                type="tel"
                error={errors.phoneNumber}
                hint="Format: +254 7XX XXX XXX or 07XX XXX XXX"
                required
              />
              <Select
                label={t('form', 'subCounty')}
                value={form.subCounty}
                onChange={e => { set('subCounty', e.target.value); set('wardId', '') }}
                options={SUB_COUNTIES.map(sc => ({ value: sc, label: sc }))}
                placeholder={t('form', 'selectSubCounty')}
                error={errors.subCounty}
                required
              />
              <Select
                label={t('form', 'ward')}
                value={form.wardId}
                onChange={e => set('wardId', e.target.value)}
                options={filteredWards}
                placeholder={form.subCounty ? t('form', 'selectWard') : 'Select sub-county first…'}
                disabled={!form.subCounty}
                error={errors.wardId}
                required
              />

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                🔒 Your National ID and phone number are encrypted before storage in compliance with Kenya's Data Protection Act 2019.
              </div>

              <Button variant="gold" fullWidth size="lg" loading={loading} onClick={handleSendOtp}>
                {t('form', 'sendOtp')} →
              </Button>
            </div>
          )}

          {/* ── STEP 1: Phone OTP ────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-meruGreen mb-1">📱 {t('form', 'otpSent')}</p>
                <p className="text-sm text-meruGreen font-mono">{form.phoneNumber}</p>
                <p className="text-xs text-gray-500 mt-1">via Africa's Talking SMS · Valid 10 minutes</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-meruBrown">Enter 6-digit code</label>
                <div className="flex gap-2 justify-center">
                  {[0,1,2,3,4,5].map(i => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      value={otp[i] ?? ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/, '')
                        const arr = otp.split('')
                        arr[i] = val
                        setOtp(arr.join(''))
                        if (val && i < 5) {
                          const next = document.getElementById(`otp-${i + 1}`)
                          next?.focus()
                        }
                      }}
                      id={`otp-${i}`}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                          document.getElementById(`otp-${i - 1}`)?.focus()
                        }
                      }}
                      className={clsx(
                        'w-11 h-12 text-center text-lg font-bold rounded-xl border-2 outline-none',
                        'focus:border-meruGold transition-colors',
                        otp[i] ? 'border-meruGreen bg-green-50' : 'border-gray-200 bg-white'
                      )}
                    />
                  ))}
                </div>
                {errors.otp && <p className="text-xs text-red-600 text-center">{errors.otp}</p>}
              </div>

              {otpVerified && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-sm font-semibold text-meruGreen">{t('form', 'verified')}</p>
                    <p className="text-xs text-gray-500">{form.fullName} · {form.wardId}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(0)}>← {t('form', 'back')}</Button>
                {!otpVerified ? (
                  <Button variant="primary" fullWidth loading={loading} onClick={handleVerifyOtp}
                    disabled={otp.length < 6}>
                    {t('form', 'verifyOtp')}
                  </Button>
                ) : (
                  <Button variant="gold" fullWidth onClick={() => setStep(2)}>
                    {t('form', 'continue')} →
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Priorities + Budget ──────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              {/* Sector chips */}
              <div>
                <label className="text-sm font-medium text-meruBrown block mb-2">
                  {t('form', 'sector')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SECTORS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => set('sector', s.value)}
                      type="button"
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all min-h-[48px] text-left',
                        form.sector === s.value
                          ? 'bg-meruGreen text-white border-meruGreen shadow-green-glow'
                          : 'bg-white text-neutralDark border-gray-200 hover:border-meruGreen/40'
                      )}
                    >
                      <span>{s.icon}</span>
                      <span className="leading-tight text-xs">{s.value}</span>
                    </button>
                  ))}
                </div>
                {errors.sector && <p className="text-xs text-red-600 mt-1">{errors.sector}</p>}
              </div>

              <Textarea
                label={t('form', 'memo')}
                value={form.memoText}
                onChange={e => set('memoText', e.target.value.slice(0, 2000))}
                placeholder={t('form', 'memoPlaceholder')}
                required
                charCount={form.memoText.length}
                maxLength={2000}
                rows={6}
                error={errors.memoText}
              />

              {/* File upload */}
              <div>
                <label className="text-sm font-medium text-meruBrown block mb-2">{t('form', 'upload')}</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-meruGreen/40 transition-colors"
                >
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                  <div className="text-2xl mb-1">📎</div>
                  <p className="text-sm text-gray-500">{fileName || 'Click to attach document'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t('form', 'uploadHint')}</p>
                </div>
              </div>

              {/* Budget sliders */}
              <div className="border border-gray-100 rounded-2xl p-4">
                <BudgetSlider values={form.sliders} onChange={sliders => set('sliders', sliders)} />
              </div>
              {errors.sliders && <p className="text-xs text-red-600">{errors.sliders}</p>}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)}>← {t('form', 'back')}</Button>
                <Button variant="gold" fullWidth size="lg" loading={loading} onClick={handleSubmit}
                  disabled={Object.values(form.sliders).reduce((a, b) => a + b, 0) !== 100}>
                  📝 {t('form', 'submit')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}
