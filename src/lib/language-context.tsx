'use client'
// src/lib/language-context.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '@/locales/translations'
import type { Language } from '@/types'

interface LanguageContextValue {
  lang:   Language
  setLang:(lang: Language) => void
  t:      (section: string, key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const stored = localStorage.getItem('baiteconnect-lang') as Language | null
    if (stored && ['en', 'sw', 'ki'].includes(stored)) {
      setLangState(stored)
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('baiteconnect-lang', newLang)
  }

  const t = (section: string, key: string): string => {
    const sec = (translations as Record<string, Record<string, Record<Language, string>>>)[section]
    if (!sec) return key
    const entry = sec[key]
    if (!entry) return key
    return entry[lang] ?? entry['en'] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
