'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { format } from 'date-fns'

const SEV_COLOR:  Record<string,string> = { low:'#2e7d32', medium:'#f57f17', high:'#c62828' }
const SEV_BG:     Record<string,string> = { low:'#e8f5e9', medium:'#fff8e1', high:'#ffebee' }
const SEV_BORDER: Record<string,string> = { low:'#a5d6a7', medium:'#ffe082', high:'#ef9a9a' }

export default function FaultsPage() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const [faults, setFaults]   = useState<any[]>([])
  const [trucks, setTrucks]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab]   = useState<'open'|'resolved'|'all'>('open')
  const [form, setForm] = useState({ truck_id:'', description:'', severity:'medium' })
  const [saving, setSaving] = useState(false)
  const [resolveNote, setResolveNote] = useState<{id:string; note:string}|null>(null)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const isTech = profile?.role === 'technician'

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('fault_reports')
      .select('*, truck:trucks(truck_number,model), reporter:profiles!reported_by(full_name)')
      .order('created_at', { ascending: false })
    if (tab === 'open')     q = q.eq('resolved', false)
    if (tab === 'resolved') q = q.eq('resolved', true)
    const [f, tr] = await Promise.all([
      q,
      supabase.from('trucks').select('id,truck_number,model').order('truck_number'),
    ])
    setFaults(f.data || [])
    setTrucks(tr.data || [])
    setLoading(false)
  }, [tab])

  useEffect(() => { load() }, [load])

  async function submit(e: any) {
    e.preventDefault()
    if (!form.truck_id || !form.description.trim()) return
    setSaving(true)
    await supabase.from('fault_reports').insert({
      ...form,
      reported_by: profile!.id,
      resolved: false,
    })
    setShowForm(false)
    setForm({ truck_id:'', description:'', severity:'medium' })
    await load()
    setSaving(false)
  }

  async function resolve(id: string, note: string) {
    await supabase.from('fault_reports').update({
      resolved: true,
      resolved_note: note || null,
      resolved_at: new Date().toISOString(),
      resolved_by: profile!.id,
    }).eq('id', id)
    setResolveNote(null)
    await load()
  }

  const openCount     = faults.filter(f => !f.resolved).length
  const highCount     = faults.filter(f => !f.resolved && f.severity === 'high').length
  const resolvedCount = faults.filter(f => f.resolved).length

  return (
    <div style={{ padding:28 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e0e0e0', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2, color:'#111' }}>{t('faultReportsTitle', lang)}</div>
          <div style={{ color:'#888', fontSize:13 }}>{lang==='zh' ? `${faults.length} 条记录` : `${faults.length} reports`}</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:3, background:'#f5f5f5', padding:3, borderRadius:9, border:'1px solid #e0e0e0' }}>
            {(['open','resolved','all'] as const).map(f => (
              <button key={f} onClick={() => setTab(f)} style={{
                padding:'6px 14px', borderRadius:7, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:700, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s',
                background: tab===f ? (f==='open'?'#e53935':f==='resolved'?'#2e7d32':'#555') : 'transparent',
                color: tab===f ? '#fff' : '#888',
              }}>
                {t(f, lang)}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>{t('reportFault', lang)}</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        {[
          { label: lang==='zh'?'未解决':'Open Faults',    value: openCount,     bg:'#ffebee', border:'#ef9a9a', color:'#c62828' },
          { label: lang==='zh'?'高危':'High Severity',    value: highCount,     bg:'#fff3e0', border:'#ffcc80', color:'#e65100' },
          { label: lang==='zh'?'已解决':'Resolved',       value: resolvedCount, bg:'#e8f5e9', border:'#a5d6a7', color:'#2e7d32' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:'14px 20px', borderTop:`3px solid ${c.border}`, background:c.bg, minWidth:120 }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:32, color:c.color, lineHeight:1 }}>{c.value}</div>
            <div style={{ fontSize:11, color:c.color, fontWeight:700, marginTop:3, textTransform:'uppercase', letterSpacing:0.4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Fault list */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {loading
          ? <div style={{ color:'#bbb', textAlign:'center', padding:40 }}>{t('loading', lang)}</div>
          : faults.length === 0
            ? <div style={{ color:'#bbb', textAlign:'center', padding:40 }}>{t('noFaultReports', lang)}</div>
            : faults.map(fault => (
            <div key={fault.id} className="card" style={{
              padding:'14px 18px',
              display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap',
              borderLeft:`4px solid ${fault.resolved ? '#e0e0e0' : SEV_BORDER[fault.severity]}`,
              opacity: fault.resolved ? 0.75 : 1,
            }}>
              {/* Severity dot */}
              <div style={{ paddingTop:3 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background: fault.resolved ? '#ccc' : SEV_COLOR[fault.severity], boxShadow: fault.resolved ? 'none' : `0 0 6px ${SEV_COLOR[fault.severity]}80` }} />
              </div>

              {/* Content */}
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontWeight:700, fontSize:14, color: fault.resolved ? '#aaa' : '#111', marginBottom:4 }}>{fault.description}</div>
                <div style={{ fontSize:11, color:'#aaa', display:'flex', gap:12, flexWrap:'wrap' }}>
                  <span>🚛 {fault.truck?.truck_number} — {fault.truck?.model}</span>
                  <span>👤 {fault.reporter?.full_name}</span>
                  <span>🕐 {format(new Date(fault.created_at), 'MMM d, h:mm a')}</span>
                </div>
                {fault.resolved_note && (
                  <div style={{ marginTop:6, fontSize:12, color:'#2e7d32', background:'#e8f5e9', padding:'5px 10px', borderRadius:6, display:'inline-block' }}>
                    ✅ Resolution: {fault.resolved_note}
                  </div>
                )}
                {fault.resolved_at && (
                  <div style={{ fontSize:10, color:'#aaa', marginTop:4 }}>
                    Resolved {format(new Date(fault.resolved_at), 'MMM d, h:mm a')}
                  </div>
                )}
              </div>

              {/* Badges + actions */}
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
                <span style={{
                  padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                  background: fault.resolved ? '#f5f5f5' : SEV_BG[fault.severity],
                  color:      fault.resolved ? '#aaa'    : SEV_COLOR[fault.severity],
                  border:     `1px solid ${fault.resolved ? '#e0e0e0' : SEV_BORDER[fault.severity]}`,
                }}>
                  {fault.severity.toUpperCase()}
                </span>

                {fault.resolved ? (
                  <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:'#e8f5e9', color:'#2e7d32', border:'1px solid #a5d6a7' }}>
                    {lang==='zh' ? '已解决' : 'RESOLVED'}
                  </span>
                ) : !isTech && (
                  <button
                    className="btn-primary"
                    onClick={() => setResolveNote({ id: fault.id, note:'' })}
                    style={{ padding:'5px 14px', fontSize:12 }}
                  >
                    {t('markResolved', lang)}
                  </button>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {/* Report Fault Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="card" style={{ width:'100%', maxWidth:480, padding:26 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:4, height:24, background:'#e53935', borderRadius:2 }} />
              <span style={{ fontFamily:'Bebas Neue', fontSize:20, letterSpacing:1, color:'#111' }}>{t('reportAFault', lang)}</span>
            </div>
            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label>{t('truck', lang)} *</label>
                <select value={form.truck_id} onChange={e => set('truck_id', e.target.value)} required>
                  <option value="">{t('selectTruck', lang)}</option>
                  {trucks.map(tr => (
                    <option key={tr.id} value={tr.id}>{tr.truck_number} — {tr.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>{t('faultDesc', lang)} *</label>
                <textarea rows={3} placeholder={lang==='zh' ? '请详细描述故障...' : 'Describe the fault in detail...'} value={form.description} onChange={e => set('description', e.target.value)} required />
              </div>
              <div>
                <label>{t('severity', lang)}</label>
                <select value={form.severity} onChange={e => set('severity', e.target.value)}>
                  <option value="low">{t('low', lang)} — {lang==='zh'?'轻微，不紧急':'Minor, non-urgent'}</option>
                  <option value="medium">{t('medium', lang)} — {lang==='zh'?'需要尽快处理':'Needs attention soon'}</option>
                  <option value="high">{t('high', lang)} — {lang==='zh'?'安全隐患':'Safety risk'}</option>
                </select>
              </div>
              {/* Severity guide */}
              <div style={{ background:'#f9f9f9', border:'1px solid #e0e0e0', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#666' }}>
                <div style={{ fontWeight:700, marginBottom:4, color:'#444' }}>{lang==='zh'?'严重程度说明:':'Severity guide:'}</div>
                <div>🟢 <b>{lang==='zh'?'低':'Low'}</b> — {lang==='zh'?'小问题，车辆仍可运行':'Minor issue, vehicle still operational'}</div>
                <div>🟡 <b>{lang==='zh'?'中':'Medium'}</b> — {lang==='zh'?'影响性能，尽快修复':'Affecting performance, fix soon'}</div>
                <div>🔴 <b>{lang==='zh'?'高':'High'}</b> — {lang==='zh'?'立即停驶，安全隐患':'Stop vehicle immediately, safety risk'}</div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex:1 }}>
                  {saving ? t('submitting', lang) : t('submitReport', lang)}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex:1 }}>{t('cancel', lang)}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve with note modal */}
      {resolveNote && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:420, padding:24 }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:20, marginBottom:4, color:'#111' }}>
              {lang==='zh' ? '解决故障' : 'RESOLVE FAULT'}
            </div>
            <div style={{ fontSize:13, color:'#888', marginBottom:14 }}>
              {lang==='zh' ? '可选：添加解决说明' : 'Optional: add a resolution note'}
            </div>
            <textarea rows={3}
              placeholder={lang==='zh' ? '例如：更换了刹车片...' : 'e.g. Replaced brake pads, tightened belt...'}
              value={resolveNote.note}
              onChange={e => setResolveNote({ ...resolveNote, note: e.target.value })}
            />
            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button className="btn-primary" onClick={() => resolve(resolveNote.id, resolveNote.note)} style={{ flex:1 }}>
                {lang==='zh' ? '确认解决' : 'Confirm Resolved'}
              </button>
              <button className="btn-ghost" onClick={() => setResolveNote(null)} style={{ flex:1 }}>{t('cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
