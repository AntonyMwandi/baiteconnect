// src/app/privacy/page.tsx
import type { Metadata } from 'next'
import Link              from 'next/link'
import { Card }          from '@/components/ui'

export const metadata: Metadata = {
  title: 'Privacy Policy — BaiteConnect Meru County',
  description: 'Privacy policy for BaiteConnect — how we collect, use and protect your data under the Kenya Data Protection Act 2019.',
}

const SECTIONS = [
  {
    title: '1. Data We Collect',
    content: [
      'Full name — used to personalise your submission confirmation and SMS notifications.',
      'National ID number — hashed using SHA-256 before storage. Never stored in plaintext. Used solely to enforce the one-submission-per-fiscal-year rule.',
      'Phone number — used to send OTP verification codes and submission status updates via SMS.',
      'Device GPS coordinates — collected at the time of submission to validate that you are physically located within Meru County and your declared ward boundary.',
      'IP address — logged for rate-limiting and anti-spam protection. Not shared with third parties.',
      'Submission text and budget slider choices — your actual memorandum content and sector allocation preferences.',
    ],
  },
  {
    title: '2. How We Use Your Data',
    content: [
      'Identity verification: your National ID hash and phone number are used to prevent duplicate submissions in a single fiscal cycle.',
      'Geolocation validation: GPS coordinates are checked against ward boundary polygons via PostGIS to ensure submissions represent genuine local residents.',
      'Statistical analysis: anonymised and aggregated submission data is used by the County Finance team to identify budget priorities by ward and sector.',
      'SMS notifications: your phone number receives submission confirmations and project update alerts. You can opt out by contacting budget.finance@meru.go.ke.',
      'Audit trail: all system actions are logged with timestamps and actor IDs for legal admissibility under the PFM Act 2012.',
    ],
  },
  {
    title: '3. Data Protection Measures',
    content: [
      'National IDs are irreversibly hashed using SHA-256 — we cannot recover your original ID number from our database.',
      'All data in transit is encrypted using TLS 1.3 (HTTPS).',
      'Database storage uses AES-256 encryption at rest on Neon PostgreSQL.',
      'Role-based access control (RBAC) ensures only authorised county officials with verified roles can access submission data.',
      'API rate limiting prevents automated data harvesting.',
    ],
  },
  {
    title: '4. Data Sharing',
    content: [
      'We do not sell, rent, or share your personal data with any third party for commercial purposes.',
      'Anonymised, aggregated submission statistics (ward-level counts, sector breakdowns) are shared with the County Assembly, Commission on Revenue Allocation, and the Senate as part of statutory MTEF reporting.',
      'Individual submission details may be disclosed to county legal counsel if required by a court order.',
      'SMS delivery is handled by Africa\'s Talking API. Your phone number is transmitted to their gateway solely for OTP and notification delivery.',
    ],
  },
  {
    title: '5. Your Rights (Kenya Data Protection Act 2019)',
    content: [
      'Right of access: you may request a copy of the personal data we hold about you by emailing budget.finance@meru.go.ke.',
      'Right to rectification: if your data is inaccurate, contact us to correct it.',
      'Right to erasure: you may request deletion of your personal data. Note that memoranda submitted as part of the official MTEF process may be retained for statutory compliance purposes even after erasure of personal details.',
      'Right to object: you may object to processing of your data for direct communications (SMS notifications) at any time.',
      'Right to lodge a complaint: you may file a complaint with the Office of the Data Protection Commissioner (ODPC) at www.odpc.go.ke.',
    ],
  },
  {
    title: '6. Data Retention',
    content: [
      'OTP verification records are deleted 30 days after creation.',
      'Session tokens expire after 7 days and are not stored in the database.',
      'Rate-limit bucket records older than 24 hours are automatically purged.',
      'Memorandum submissions are retained for 10 years as part of the official public participation record, consistent with the Archives and Documentation Service Act.',
      'Audit log entries are retained indefinitely as they constitute legal evidence of system activity.',
    ],
  },
  {
    title: '7. Cookies',
    content: [
      'BaiteConnect uses a single HttpOnly session cookie (baiteconnect-session) for authenticated admin users.',
      'This cookie is not used for tracking or advertising purposes.',
      'Language preference is stored in localStorage — a browser storage mechanism that does not send data to our servers.',
      'No third-party analytics or advertising cookies are used.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="bg-meru-header rounded-2xl px-6 py-8 text-white">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/70 text-sm">
          County Government of Meru · BaiteConnect Portal · Last updated: May 2026
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs">
          <span>⚖️</span>
          <span>Compliant with Kenya Data Protection Act 2019</span>
        </div>
      </div>

      {/* Intro */}
      <Card className="p-6">
        <p className="text-gray-700 leading-relaxed">
          The County Government of Meru (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the County&rdquo;) operates BaiteConnect at{' '}
          <strong>baiteconnect.meru.go.ke</strong>. This Privacy Policy explains how we collect, use, store, and protect
          your personal information when you use our platform, in compliance with the{' '}
          <strong>Kenya Data Protection Act 2019</strong> and the{' '}
          <strong>African Union Convention on Cyber Security and Personal Data Protection</strong>.
        </p>
      </Card>

      {/* Policy sections */}
      {SECTIONS.map(section => (
        <Card key={section.title} className="p-6">
          <h2 className="font-bold text-neutralDark text-lg mb-4">{section.title}</h2>
          <ul className="space-y-2.5">
            {section.content.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                <span className="text-meruGreen mt-1 shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      {/* Contact for privacy */}
      <Card className="p-6 bg-green-50 border-meruGreen/20">
        <h2 className="font-bold text-meruGreen text-lg mb-3">Data Protection Contact</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          For all data protection enquiries, requests, or complaints, contact the Data Protection Officer at:
        </p>
        <div className="space-y-1.5 text-sm">
          <p><strong>Email:</strong> <a href="mailto:dpo@meru.go.ke" className="text-meruGreen hover:underline">dpo@meru.go.ke</a></p>
          <p><strong>Postal:</strong> Data Protection Officer, P.O. Box 120 – 60200, Meru, Kenya</p>
          <p><strong>ODPC:</strong> <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-meruGreen hover:underline">www.odpc.go.ke</a></p>
        </div>
      </Card>

      {/* Back links */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/" className="text-sm text-meruGreen border border-meruGreen/30 px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors">
          ← Back to Portal
        </Link>
        <Link href="/contact" className="text-sm text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          Contact Us
        </Link>
      </div>
    </div>
  )
}
