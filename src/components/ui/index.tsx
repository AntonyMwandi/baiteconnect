'use client'
// src/components/ui/index.tsx
// Reusable design-system primitives for BaiteConnect

import React, { useEffect, useState } from 'react'
import { clsx } from 'clsx'

// ─── Button ───────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type BtnSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  BtnVariant
  size?:     BtnSize
  loading?:  boolean
  icon?:     React.ReactNode
  fullWidth?:boolean
}

export function Button({
  variant = 'primary', size = 'md', loading = false,
  icon, fullWidth = false, children, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-meruGold focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants: Record<BtnVariant, string> = {
    primary:   'bg-meruGreen text-white hover:bg-green-900 active:scale-95 shadow-card',
    secondary: 'bg-white text-meruGreen border border-meruGreen/30 hover:bg-green-50 active:scale-95',
    ghost:     'bg-transparent text-meruGreen hover:bg-green-50 active:scale-95',
    danger:    'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-card',
    gold:      'bg-meruGold text-meruGreen hover:bg-yellow-400 active:scale-95 shadow-gold-glow font-bold',
  }

  const sizes: Record<BtnSize, string> = {
    sm: 'text-xs px-3 py-2 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 min-h-[44px]',
    lg: 'text-base px-6 py-3 min-h-[52px]',
  }

  return (
    <button
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="text-base leading-none">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  hint?:     string
  icon?:     React.ReactNode
}

export function Input({ label, error, hint, icon, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-meruBrown">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full rounded-xl border bg-white text-neutralDark text-sm placeholder:text-gray-400',
            'transition-all duration-150 outline-none',
            'focus:ring-2 focus:ring-meruGreen/30 focus:border-meruGreen',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            'min-h-[44px] px-3.5 py-2.5',
            icon && 'pl-10',
            error ? 'border-red-400 bg-red-50' : 'border-gray-200',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string
  error?:    string
  options:   { value: string | number; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-meruBrown">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full rounded-xl border bg-white text-neutralDark text-sm',
          'transition-all duration-150 outline-none min-h-[44px] px-3.5 py-2.5',
          'focus:ring-2 focus:ring-meruGreen/30 focus:border-meruGreen',
          'disabled:bg-gray-50 disabled:cursor-not-allowed',
          error ? 'border-red-400' : 'border-gray-200',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:      string
  error?:      string
  charCount?:  number
  maxLength?:  number
}

export function Textarea({ label, error, charCount, maxLength, className, id, ...props }: TextareaProps) {
  const taId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={taId} className="text-sm font-medium text-meruBrown">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {maxLength !== undefined && charCount !== undefined && (
            <span className={clsx('text-xs', charCount >= maxLength ? 'text-red-500' : 'text-gray-400')}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}
      <textarea
        id={taId}
        className={clsx(
          'w-full rounded-xl border bg-white text-neutralDark text-sm placeholder:text-gray-400',
          'transition-all duration-150 outline-none resize-y',
          'focus:ring-2 focus:ring-meruGreen/30 focus:border-meruGreen',
          'px-3.5 py-2.5 min-h-[120px] leading-relaxed',
          error ? 'border-red-400 bg-red-50' : 'border-gray-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'gold' | 'red' | 'blue' | 'gray' | 'amber'

export function Badge({ variant = 'gray', children, className }: {
  variant?:  BadgeVariant
  children:  React.ReactNode
  className?: string
}) {
  const styles: Record<BadgeVariant, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    gold:  'bg-yellow-100 text-yellow-800 border-yellow-200',
    red:   'bg-red-100 text-red-700 border-red-200',
    blue:  'bg-blue-100 text-blue-800 border-blue-200',
    gray:  'bg-gray-100 text-gray-700 border-gray-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', styles[variant], className)}>
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────
export function Card({ children, className, hover = false }: {
  children:   React.ReactNode
  className?: string
  hover?:     boolean
}) {
  return (
    <div className={clsx(
      'bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden',
      hover && 'hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
      className
    )}>
      {children}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#01411C', height = 6, label }: {
  value:   number
  max?:    number
  color?:  string
  height?: number
  label?:  string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs font-semibold" style={{ color }}>{pct}%</span>
        </div>
      )}
      <div className="w-full rounded-full bg-gray-100 overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Step Indicator ───────────────────────────────────────────
export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center gap-1">
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
              idx < current  ? 'bg-meruGreen text-white' :
              idx === current ? 'bg-meruGold text-meruGreen ring-2 ring-meruGold ring-offset-1' :
              'bg-gray-100 text-gray-400'
            )}>
              {idx < current ? '✓' : idx + 1}
            </div>
            <span className={clsx(
              'text-[10px] font-medium text-center max-w-[72px] leading-tight hidden sm:block',
              idx === current ? 'text-meruGreen' : idx < current ? 'text-meruGreen/70' : 'text-gray-400'
            )}>
              {step}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={clsx(
              'flex-1 h-0.5 mx-1 mb-5 transition-colors duration-300',
              idx < current ? 'bg-meruGreen' : 'bg-gray-200'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────
export function Toast({ message, type, onClose }: {
  message: string
  type:    'success' | 'error' | 'warning' | 'info'
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'bg-green-900 border-green-600 text-white',
    error:   'bg-red-900 border-red-600 text-white',
    warning: 'bg-amber-800 border-amber-500 text-white',
    info:    'bg-blue-900 border-blue-600 text-white',
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }

  return (
    <div className={clsx(
      'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[calc(100vw-2rem)]',
      'flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-card-lg animate-slide-up',
      styles[type]
    )}>
      <span className="text-lg shrink-0">{icons[type]}</span>
      <p className="text-sm leading-snug flex-1">{message}</p>
      <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none shrink-0">×</button>
    </div>
  )
}

// ─── Skeleton Loader ──────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx(
      'animate-pulse rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
      'bg-[length:200%_100%] animate-shimmer',
      className
    )} />
  )
}

// ─── Empty State ──────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }: {
  icon?:         string
  title:         string
  description?:  string
  action?:       React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <div className="text-5xl">{icon}</div>
      <h3 className="text-lg font-semibold text-neutralDark">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = '#01411C', icon }: {
  label: string
  value: string | number
  sub?:  string
  color?: string
  icon?:  string
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold leading-none" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {icon && <span className="text-2xl opacity-80">{icon}</span>}
      </div>
    </Card>
  )
}

// ─── Section Header ───────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: {
  title:     string
  subtitle?: string
  action?:   React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutralDark leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
