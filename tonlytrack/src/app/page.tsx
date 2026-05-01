'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [form, setForm] = useState({ email:'', password:'', full_name:'', role:'technician' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function submit(e: any) {
    e.preventDefault()
    setLoading(true); setError('')
    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (err) setError(err.message)
      else router.push('/dashboard')
    } else {
      const { data, error: err } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if (err) { setError(err.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, full_name: form.full_name, email: form.email, role: form.role })
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      {/* BG */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(249,115,22,0.15), transparent)' }} />
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)' }} />

      <div style={{ position:'relative', width:'100%', maxWidth:440, margin:'0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg, #f97316, #ea580c)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M1 3h15v13H1V3zm15 5h3l3 3v5h-6V8zM4 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/></svg>
            </div>
            <span style={{ fontFamily:'Bebas Neue', fontSize:28, letterSpacing:2, color:'white' }}>TONLY<span style={{ color:'#f97316' }}>TRACK</span></span>
          </div>
          <p style={{ color:'#555570', fontSize:13 }}>Fleet Maintenance Management System</p>
        </div>

        <div className="card" style={{ padding:32 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:28, background:'#111118', padding:4, borderRadius:10 }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'9px', borderRadius:7, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, transition:'all 0.2s',
                background: mode === m ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'transparent',
                color: mode === m ? 'white' : '#555570' }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {mode === 'register' && (
              <div>
                <label>Full Name</label>
                <input placeholder="John Mensah" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </div>
            )}
            <div>
              <label>Email Address</label>
              <input type="email" placeholder="you@tonlytrucks.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            {mode === 'register' && (
              <div>
                <label>Role</label>
                <select value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="technician">Technician</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="senior_supervisor">Senior Supervisor</option>
                </select>
              </div>
            )}
            {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', padding:'10px 14px', borderRadius:8, fontSize:13 }}>{error}</div>}
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop:4, padding:'13px', fontSize:15 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:20, color:'#333350', fontSize:12 }}>© 2024 Tonly Trucks · TonlyTrack v1.0</p>
      </div>
    </div>
  )
}
