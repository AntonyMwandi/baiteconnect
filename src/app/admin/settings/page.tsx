'use client'
// src/app/admin/settings/page.tsx
// System settings — fiscal year config, blocklist, SMS sender

import { useState } from 'react'
import { Card, Button, Input, Textarea, Toast, SectionHeader } from '@/components/ui'

type ToastState = { type: 'success'|'error'; message: string } | null

export default function SettingsPage() {
  const [toast, setToast]   = useState<ToastState>(null)
  const [saved, setSaved]   = useState<Record<string, boolean>>({})

  // Simulate save
  const handleSave = (section: string) => {
    setSaved(s => ({ ...s, [section]: true }))
    setToast({ type: 'success', message: `${section} settings saved.` })
    setTimeout(() => setSaved(s => ({ ...s, [section]: false })), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SectionHeader
        title="System Settings"
        subtitle="Configure BaiteConnect for the current fiscal cycle."
      />

      {/* Fiscal year */}
      <Card className="p-5">
        <h3 className="font-semibold text-neutralDark mb-4">📅 Fiscal Year Configuration</h3>
        <div className="space-y-3">
          <Input label="Active fiscal year" defaultValue="2026/2027" hint="Format: YYYY/YYYY. This controls which cycle citizens submit to." />
          <Input label="Submission window opens" type="date" defaultValue="2026-01-15" />
          <Input label="Submission window closes" type="date" defaultValue="2026-03-31" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="submissions-open" defaultChecked className="w-4 h-4 accent-meruGreen" />
            <label htmlFor="submissions-open" className="text-sm text-gray-700">Submissions currently open to the public</label>
          </div>
        </div>
        <Button variant="primary" className="mt-4" onClick={() => handleSave('Fiscal year')} loading={saved['Fiscal year']}>
          Save fiscal settings
        </Button>
      </Card>

      {/* Content moderation */}
      <Card className="p-5">
        <h3 className="font-semibold text-neutralDark mb-1">🛡️ Content Moderation Blocklist</h3>
        <p className="text-sm text-gray-500 mb-4">Comma-separated terms that trigger an automatic under_review flag. Applied across English, Kiswahili, and Kimîîru.</p>
        <Textarea
          label="Blocked terms (comma-separated)"
          defaultValue="umbwa, mavi, shenzi, ghassia, mshenzi, matako, meffi, mjinga, fuck, shit, bastard, idiot"
          rows={4}
          hint="Keep this list up to date. Terms are matched case-insensitively."
        />
        <Input label="Custom regex pattern (advanced)" placeholder="e.g. \b(pattern1|pattern2)\b" className="mt-3" hint="Advanced: raw regex applied to submission text." />
        <Button variant="primary" className="mt-4" onClick={() => handleSave('Moderation')}>
          Save blocklist
        </Button>
      </Card>

      {/* SMS config */}
      <Card className="p-5">
        <h3 className="font-semibold text-neutralDark mb-4">📱 SMS Gateway (Africa&apos;s Talking)</h3>
        <div className="space-y-3">
          <Input label="Username"   defaultValue="sandbox" hint="Use 'sandbox' for development, your AT username for production." />
          <Input label="Sender ID"  defaultValue="BAITECONN" hint="Max 11 characters. Appears as sender name on OTP SMS." />
          <Input label="API Key"    type="password" defaultValue="••••••••••••••••" hint="Your Africa's Talking production API key." />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            ⚠️ API keys are stored as encrypted environment variables. Changes here update the runtime config only and do not write to .env files.
          </div>
        </div>
        <Button variant="primary" className="mt-4" onClick={() => handleSave('SMS')}>
          Save SMS config
        </Button>
      </Card>

      {/* Rate limits */}
      <Card className="p-5">
        <h3 className="font-semibold text-neutralDark mb-4">⚡ Rate Limiting</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Max requests per minute (per IP)"  type="number" defaultValue="5"  hint="Token bucket ceiling. Applies to all submission endpoints." />
          <Input label="Max memos per user per fiscal year" type="number" defaultValue="1"  hint="Citizens can only submit once per MTEF cycle." />
          <Input label="OTP max attempts"                  type="number" defaultValue="5"  hint="Failed OTP attempts before locking the session." />
          <Input label="OTP expiry (minutes)"              type="number" defaultValue="10" hint="Time before OTP code expires." />
        </div>
        <Button variant="primary" className="mt-4" onClick={() => handleSave('Rate limits')}>
          Save rate limits
        </Button>
      </Card>

      {/* Geo config */}
      <Card className="p-5">
        <h3 className="font-semibold text-neutralDark mb-4">🗺️ Geolocation Settings</h3>
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="County bounds — Min Lat" type="number" defaultValue="-0.0500" />
            <Input label="County bounds — Max Lat" type="number" defaultValue="0.7000"  />
            <Input label="County bounds — Min Lng" type="number" defaultValue="36.8000" />
            <Input label="County bounds — Max Lng" type="number" defaultValue="38.2000" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="geo-required" defaultChecked className="w-4 h-4 accent-meruGreen" />
            <label htmlFor="geo-required" className="text-sm text-gray-700">
              Require GPS coordinates on submission (shadow-ban if outside county bounds)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ward-boundary-check" defaultChecked className="w-4 h-4 accent-meruGreen" />
            <label htmlFor="ward-boundary-check" className="text-sm text-gray-700">
              Enable PostGIS ward boundary check (flag as under_review if outside ward polygon)
            </label>
          </div>
        </div>
        <Button variant="primary" className="mt-4" onClick={() => handleSave('Geolocation')}>
          Save geo settings
        </Button>
      </Card>

      {/* Danger zone */}
      <Card className="p-5 border-red-200 bg-red-50">
        <h3 className="font-semibold text-red-800 mb-2">⚠️ Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">These actions are irreversible. Only use during off-cycle maintenance windows.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="danger" size="sm">Clear rate limit buckets</Button>
          <Button variant="danger" size="sm">Flush expired OTP records</Button>
          <Button variant="danger" size="sm">Export all data (GDPR)</Button>
        </div>
      </Card>
    </div>
  )
}
