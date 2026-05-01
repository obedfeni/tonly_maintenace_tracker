'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { format } from 'date-fns'

export default function FaultsPage() {
  const { profile } = useAuth()
  const [faults, setFaults] = useState<any[]>([])
  const [trucks, setTrucks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ truck_id:'', description:'', severity:'medium' })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [])

  async function load() {
    const [f, t] = await Promise.all([
      supabase.from('fault_reports').select('*, truck:trucks(truck_number,model), reporter:profiles!reported_by(full_name)').order('created_at',{ascending:false}),
      supabase.from('trucks').select('id,truck_number,model')
    ])
    setFaults(f.data || []); setTrucks(t.data || []); setLoading(false)
  }

  async function submit(e: any) {
    e.preventDefault(); setSaving(true)
    await supabase.from('fault_reports').insert({ ...form, reported_by: profile!.id, resolved: false })
    setShowForm(false); setForm({ truck_id:'', description:'', severity:'medium' }); await load(); setSaving(false)
  }

  async function resolve(id: string) {
    await supabase.from('fault_reports').update({ resolved: true }).eq('id', id)
    await load()
  }

  const sevColor: Record<string, string> = { low:'#4ade80', medium:'#fbbf24', high:'#f87171' }

  return (
    <div style={{ padding:32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2 }}>FAULT <span style={{ color:'#f97316' }}>REPORTS</span></div>
          <div style={{ color:'#555570', fontSize:13 }}>{faults.filter(f => !f.resolved).length} open reports</div>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>⚠️ Report Fault</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? <div style={{ color:'#333350', textAlign:'center', padding:40 }}>Loading...</div> :
         faults.length === 0 ? <div style={{ color:'#333350', textAlign:'center', padding:40 }}>No fault reports yet.</div> :
         faults.map(fault => (
          <div key={fault.id} className="card" style={{ padding:18, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', opacity: fault.resolved ? 0.5 : 1 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background: sevColor[fault.severity], flexShrink:0, boxShadow: fault.resolved ? 'none' : `0 0 8px ${sevColor[fault.severity]}` }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:15 }}>{fault.description}</div>
              <div style={{ fontSize:12, color:'#555570', marginTop:3 }}>
                🚛 {fault.truck?.truck_number} {fault.truck?.model} · 👤 {fault.reporter?.full_name} · {format(new Date(fault.created_at),'MMM d, h:mm a')}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:`${sevColor[fault.severity]}20`, color:sevColor[fault.severity], border:`1px solid ${sevColor[fault.severity]}50` }}>
                {fault.severity.toUpperCase()}
              </span>
              {fault.resolved
                ? <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(34,197,94,0.1)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.3)' }}>RESOLVED</span>
                : profile?.role !== 'technician' && <button className="btn-primary" onClick={() => resolve(fault.id)} style={{ padding:'5px 14px', fontSize:12 }}>Mark Resolved</button>
              }
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:460, padding:28 }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:22, marginBottom:20 }}>REPORT A FAULT</div>
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label>Truck</label>
                <select value={form.truck_id} onChange={e => set('truck_id',e.target.value)} required>
                  <option value="">Select truck...</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.truck_number} — {t.model}</option>)}
                </select>
              </div>
              <div>
                <label>Fault Description</label>
                <textarea rows={3} placeholder="Describe the fault or issue..." value={form.description} onChange={e => set('description',e.target.value)} required />
              </div>
              <div>
                <label>Severity</label>
                <select value={form.severity} onChange={e => set('severity',e.target.value)}>
                  <option value="low">Low — Minor issue</option>
                  <option value="medium">Medium — Needs attention soon</option>
                  <option value="high">High — Urgent / Safety risk</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex:1 }}>{saving ? 'Submitting...' : 'Submit Report'}</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
