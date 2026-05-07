'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'

export default function AuthPage() {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [form, setForm] = useState({ email:'', password:'', full_name:'', role:'technician' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { lang, setLang } = useLang()

  useEffect(() => { if (user) router.push('/dashboard') }, [user])
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e: any) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
        if (err) { setError(err.message); setLoading(false); return }
        router.push('/dashboard')
      } else {
        if (!form.full_name.trim()) { setError('Full name required'); setLoading(false); return }
        if (form.password.length < 6) { setError('Password must be 6+ characters'); setLoading(false); return }
        const { data, error: err } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password })
        if (err) { setError(err.message); setLoading(false); return }
        if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, full_name: form.full_name.trim(), email: form.email.trim(), role: form.role })
          router.push('/dashboard')
        }
      }
    } catch (e: any) { setError(e.message || 'Something went wrong') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f5f5', position:'relative' }}>
      <div style={{ position:'fixed', top:0, left:0, right:0, height:4, background:'linear-gradient(90deg,#e53935,#ef9a9a,#e53935)', zIndex:10 }} />
      <div style={{ position:'fixed', top:16, right:20, display:'flex', gap:6, zIndex:10 }}>
        <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={() => setLang('en')}>EN</button>
        <button className={`lang-btn ${lang==='zh'?'active':''}`} onClick={() => setLang('zh')}>中文</button>
      </div>
      <div style={{ width:'100%', maxWidth:420, margin:'0 20px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <div style={{ width:52, height:52, background:'linear-gradient(135deg,#e53935,#c62828)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, boxShadow:'0 6px 20px rgba(229,57,53,0.3)' }}>🚛</div>
            <div>
              <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:3, lineHeight:1, color:'#111' }}>TONLY<span style={{ color:'#e53935' }}>TRACK</span></div>
              <div style={{ fontSize:10, color:'#e53935', letterSpacing:2, fontWeight:700 }}>FLEET MAINTENANCE</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding:28 }}>
          <div style={{ display:'flex', gap:4, marginBottom:24, background:'#f0f0f0', padding:4, borderRadius:10 }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{ flex:1, padding:'9px', borderRadius:7, border:'none', cursor:'pointer', fontSize:14, fontWeight:700, transition:'all 0.2s', fontFamily:'DM Sans,sans-serif',
                background: mode===m ? 'linear-gradient(135deg,#e53935,#c62828)' : 'transparent',
                color: mode===m ? '#fff' : '#999' }}>
                {t(m === 'login' ? 'signIn' : 'register', lang)}
              </button>
            ))}
          </div>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {mode === 'register' && (
              <div><label>{t('fullName',lang)}</label><input placeholder="e.g. Kofi Mensah" value={form.full_name} onChange={e => set('full_name',e.target.value)} required /></div>
            )}
            <div><label>{t('email',lang)}</label><input type="email" placeholder="you@tonlytrucks.com" value={form.email} onChange={e => set('email',e.target.value)} required /></div>
            <div><label>{t('password',lang)}</label><input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password',e.target.value)} required /></div>
            {mode === 'register' && (
              <div><label>{t('yourRole',lang)}</label>
                <select value={form.role} onChange={e => set('role',e.target.value)}>
                  <option value="technician">{t('technician',lang)}</option>
                  <option value="supervisor">{t('supervisor',lang)}</option>
                  <option value="senior_supervisor">{t('seniorSupervisor',lang)}</option>
                </select>
              </div>
            )}
            {error && <div style={{ background:'#ffebee', border:'1px solid #ef9a9a', color:'#c62828', padding:'10px 14px', borderRadius:8, fontSize:13 }}>{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding:'13px', fontSize:15, marginTop:4 }}>
              {loading ? t('pleaseWait',lang) : mode==='login' ? t('signIn',lang) : t('createAccount',lang)}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:16, color:'#bbb', fontSize:11 }}>© {new Date().getFullYear()} Tonly Trucks · TonlyTrack v1.0</p>
      </div>
    </div>
  )
}
