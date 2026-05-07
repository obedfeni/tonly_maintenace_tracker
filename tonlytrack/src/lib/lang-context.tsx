'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Lang } from './i18n'

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang:'en', setLang:()=>{} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  useEffect(() => {
    const saved = localStorage.getItem('tt_lang') as Lang
    if (saved === 'en' || saved === 'zh') setLangState(saved)
  }, [])
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('tt_lang', l) }
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)
