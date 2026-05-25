// src/lib/security.ts
// BaiteConnect — Security, Rate Limiting, Geo Validation, Content Moderation

import prisma from './prisma'
import type { RateLimitResult, GeoValidationResult } from '@/types'
import { MERU_COUNTY_BOUNDS } from '@/types'

// ─────────────────────────────────────────────────────────────
// CONTENT MODERATION — Regex blocklist (EN + SW + Kimîîru)
// ─────────────────────────────────────────────────────────────
const BLOCKED_TERMS: RegExp[] = [
  // English explicit / defamatory
  /\b(fuck|shit|ass|bitch|bastard|idiot|stupid|moron|cunt|damn|retard)\b/gi,
  // Kiswahili profanity / ethnic slurs
  /\b(umbwa|mavi|matako|meffi|shenzi|mjinga|ghassia|mshenzi)\b/gi,
  // Hate speech triggers
  /\b(tribe|tribal|kikuyu|luo|kalenjin)\s+(domination|must|should|die|out|leave)/gi,
  // Political defamation patterns
  /\b(governor|mutuma|mca)\s+(is\s+)?(corrupt|stealing|thief|liar|criminal)\b/gi,
]

export function moderateContent(text: string): 'APPROVED' | 'UNDER_REVIEW' {
  for (const pattern of BLOCKED_TERMS) {
    if (pattern.test(text)) return 'UNDER_REVIEW'
  }
  return 'APPROVED'
}

// ─────────────────────────────────────────────────────────────
// RATE LIMITING — Token Bucket (DB-backed, 5 req/min per IP/user)
// ─────────────────────────────────────────────────────────────
const MAX_TOKENS      = 5
const REFILL_INTERVAL = 60 * 1000 // 1 minute in ms

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const now = new Date()

  const bucket = await prisma.rateLimitBucket.upsert({
    where:  { identifier },
    create: { identifier, tokens: MAX_TOKENS - 1, lastRefill: now },
    update: {},
  })

  const elapsed   = now.getTime() - bucket.lastRefill.getTime()
  const refills   = Math.floor(elapsed / REFILL_INTERVAL)
  const newTokens = Math.min(MAX_TOKENS, bucket.tokens + refills)

  if (refills > 0) {
    await prisma.rateLimitBucket.update({
      where: { identifier },
      data:  { tokens: newTokens - 1, lastRefill: now },
    })
    return { allowed: true, remaining: newTokens - 1, resetAt: new Date(now.getTime() + REFILL_INTERVAL) }
  }

  if (bucket.tokens <= 0) {
    const resetAt = new Date(bucket.lastRefill.getTime() + REFILL_INTERVAL)
    return { allowed: false, remaining: 0, resetAt }
  }

  await prisma.rateLimitBucket.update({
    where: { identifier },
    data:  { tokens: { decrement: 1 } },
  })

  return { allowed: true, remaining: bucket.tokens - 1, resetAt: new Date(now.getTime() + REFILL_INTERVAL) }
}

// ─────────────────────────────────────────────────────────────
// GEOLOCATION — Meru bounding box pre-filter + PostGIS ward check
// ─────────────────────────────────────────────────────────────
export function isWithinMeruBounds(lat: number, lng: number): boolean {
  return (
    lat >= MERU_COUNTY_BOUNDS.minLat &&
    lat <= MERU_COUNTY_BOUNDS.maxLat &&
    lng >= MERU_COUNTY_BOUNDS.minLng &&
    lng <= MERU_COUNTY_BOUNDS.maxLng
  )
}

export async function validateGeoLocation(
  lat: number,
  lng: number,
  wardId: number
): Promise<GeoValidationResult> {
  // Step 1: Quick bounding-box pre-filter (no DB hit)
  const isWithinMeru = isWithinMeruBounds(lat, lng)
  if (!isWithinMeru) {
    return { isWithinMeru: false, isWithinWard: false }
  }

  // Step 2: PostGIS polygon intersection check
  // ward_boundary geometry column managed via raw SQL migration
  try {
    const result = await prisma.$queryRaw<Array<{ within: boolean }>>`
      SELECT ST_Contains(
        ward_boundary,
        ST_SetSRID(ST_MakePoint(${lng}::float8, ${lat}::float8), 4326)
      ) AS within
      FROM wards
      WHERE id = ${wardId}
      AND ward_boundary IS NOT NULL
      LIMIT 1
    `

    if (!result || result.length === 0) {
      // No boundary polygon stored yet — fall back to bounding box approval
      return { isWithinMeru: true, isWithinWard: true }
    }

    return { isWithinMeru: true, isWithinWard: result[0].within ?? false }
  } catch {
    // PostGIS extension not yet configured — approve with bounding box only
    return { isWithinMeru: true, isWithinWard: true }
  }
}

// ─────────────────────────────────────────────────────────────
// IDENTITY — Phone + National ID validation
// ─────────────────────────────────────────────────────────────
export function validateKenyanPhone(phone: string): boolean {
  // Accepts +2547XXXXXXXX or 07XXXXXXXX (normalised to +254)
  return /^\+254[17]\d{8}$/.test(phone) || /^0[17]\d{8}$/.test(phone)
}

export function normalisePhone(phone: string): string {
  if (phone.startsWith('0')) return '+254' + phone.slice(1)
  return phone
}

export function validateNationalId(id: string): boolean {
  return /^\d{7,8}$/.test(id.trim())
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOGGING
// ─────────────────────────────────────────────────────────────
export async function writeAuditLog(params: {
  actorId?:   string
  action:     string
  entityType: string
  entityId:   string
  metadata?:  Record<string, unknown>
  ipAddress?: string
}) {
  await prisma.auditLog.create({ data: params })
}

// ─────────────────────────────────────────────────────────────
// REFERENCE CODE GENERATOR
// ─────────────────────────────────────────────────────────────
export function generateReferenceCode(): string {
  const prefix    = 'MCB'
  const year      = new Date().getFullYear().toString().slice(-2)
  const random    = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}${year}-${random}`
}
