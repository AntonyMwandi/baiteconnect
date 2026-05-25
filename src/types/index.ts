// src/types/index.ts
// BaiteConnect — Shared TypeScript Type Definitions

export type Language = 'en' | 'sw' | 'ki'

export type UserRole = 'CITIZEN' | 'MCA' | 'COUNTY_ADMIN' | 'GOVERNOR_EXEC'

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'UNDER_REVIEW' | 'SHADOW_BANNED'

export type ProjectStage = 'ALLOCATED' | 'TENDERED' | 'ONGOING' | 'COMPLETED'

export type ReportStatus = 'UNDER_REVIEW' | 'MYS_DISPATCHED' | 'RESOLVED'

export interface Ward {
  id:        number
  wardName:  string
  subCounty: string
  mcaUserId: string | null
  _count?: { memoranda: number }
}

export interface WardWithCount extends Ward {
  submissionCount: number
  rank:            number
}

export interface Sector {
  key:     string
  label:   Record<Language, string>
  baseVal: number
  color:   string
  icon:    string
}

export interface SliderChoices {
  health:       number
  agriculture:  number
  roads:        number
  water:        number
  publicService:number
}

export interface MemorandumPayload {
  fullName:      string
  nationalId:    string
  phoneNumber:   string
  subCounty:     string
  wardId:        number
  fiscalYear:    string
  sectorCategory:string
  writtenText:   string
  attachmentUrl? :string
  sliderChoices: SliderChoices
  latitude:      number
  longitude:     number
}

export interface ProjectWithReports {
  id:               string
  wardId:           number
  title:            string
  description:      string | null
  allocatedBudget:  number
  currentStage:     ProjectStage
  contractorName:   string | null
  mcaPriorityMatch: boolean
  latitude:         number | null
  longitude:        number | null
  updatedAt:        Date
  ward: {
    wardName:  string
    subCounty: string
  }
  _count: {
    whistleReports: number
  }
  stageHistory: StageHistoryItem[]
}

export interface StageHistoryItem {
  id:        number
  stage:     ProjectStage
  notes:     string | null
  updatedBy: string | null
  createdAt: Date
}

export interface ExecutiveMatrixRow {
  wardName:        string
  subCounty:       string
  topCitizenPriority: string
  citizenPct:      number
  mcaProposal:     string
  isAligned:       boolean
  totalSubmissions:number
}

export interface ApiResponse<T = unknown> {
  success:  boolean
  data?:    T
  error?:   string
  message?: string
}

export interface OtpRequest {
  phoneNumber: string
  fullName:    string
  nationalId:  string
}

export interface OtpVerifyRequest {
  phoneNumber: string
  otpCode:     string
}

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   Date
}

export interface GeoValidationResult {
  isWithinMeru:  boolean
  isWithinWard:  boolean
  distanceFromWardCentroid?: number
}

export interface NavItem {
  key:    string
  label:  Record<Language, string>
  href:   string
  icon:   string
  adminOnly?: boolean
}

export interface ToastMessage {
  id:      string
  type:    'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// Meru County bounding box for quick pre-filter before PostGIS
export const MERU_COUNTY_BOUNDS = {
  minLat:  -0.0500,
  maxLat:   0.7000,
  minLng:  36.8000,
  maxLng:  38.2000,
} as const

export const CURRENT_FISCAL_YEAR = '2026/2027' as const

export const SUB_COUNTIES = [
  'Igembe North',
  'Igembe Central',
  'Igembe South',
  'Tigania West',
  'Tigania East',
  'Central Imenti',
  'North Imenti',
  'South Imenti',
  'Buuri',
] as const

export type SubCounty = (typeof SUB_COUNTIES)[number]
