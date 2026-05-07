'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, TruckStatus } from '@/lib/supabase'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { format, differenceInDays } from 'date-fns'

const STATUS_OPTS: TruckStatus[] = ['active','in_repair','awaiting_parts','out_of_service']
const STATUS_LABEL: Record<string,string> = { active:'Active', in_repair:'In Repair', awaiting_parts:'Awaiting Parts', out_of_service:'Out of Service' }
const EMPTY = { truck_number:'', plate:'', model:'', vin:'', status:'active' as TruckStatus, last_service:'', next_service:'' }

export default function TrucksPage() {
  const { lang } = useLang()
  const [trucks, setTrucks]   = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTruck, setEditTruck] = useState<any>(null)
  const [loading, setLoading]  = useState(true)
  const [form, setForm]        = useState({ ...EMPTY })
  const [saving, setSaving]    = useState(false)
  const [search, setSearch]    = useState('')
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    const { data } = await supabase.from('trucks').select('*').order('truck_number')
    setTrucks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditTruck(null); setForm({ ...EMPTY }); setShowForm(true) }
  function openEdit(tr: any) {
    setEditTruck(tr)
    setForm({ truck_number:tr.truck_number, plate:tr.plate, model:tr.model, vin:tr.vin||'', status:tr.status, last_service:tr.last_service||'', next_service:tr.next_service||'' })
    setShowForm(true)
  }

  async function save(e: any) {
    e.preventDefault(); setSaving(true)
    if (editTruck) await supabase.from('trucks').update(form).eq('id', editTruck.id)
    else await supabase.from('trucks').insert(form)
    setShowForm(false); setEditTruck(null); await load(); setSaving(false)
  }

  async function confirmDelete() {
    if (!deleteId) return
    await supabase.from('trucks').delete().eq('id', deleteId)
    setDeleteId(null); await load()
  }

  const filtered = trucks
    .filter(tr => statusFilter === 'all' || tr.status === statusFilter)
    .filter(tr => [tr.truck_number, tr.model, tr.plate, tr.vin].some(v => v?.toLowerCase().includes(search.toLowerCase())))

  function serviceDaysLeft(nextService: string) {
    if (!nextService) return null
    return differenceInDays(new Date(nextService), new Date())
  }

  return (
    <div style={{ padding:28 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e0e0e0', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2, color:'#111' }}>{t('fleetMgmt', lang)}</div>
          <div style={{ color:'#888', fontSize:13 }}>{trucks.length} {lang==='zh'?'辆车':'trucks registered'}</div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <input placeholder={t('searchTrucks', lang)} value={search} onChange={e => setSearch(e.target.value)} style={{ width:180 }} />
          <button className="btn-primary" onClick={openAdd}>{t('addTruck', lang)}</button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['all', ...STATUS_OPTS].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding:'5px 14px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:700,
            fontFamily:'DM Sans,sans-serif', transition:'all 0.15s', textTransform:'capitalize',
            background: statusFilter===s ? '#e53935' : '#fff',
            color:      statusFilter===s ? '#fff'    : '#888',
            border:     `1.5px solid ${statusFilter===s ? '#e53935' : '#e0e0e0'}`,
          }}>
            {s === 'all' ? (lang==='zh'?'全部':'All') : STATUS_LABEL[s]} ({s==='all' ? trucks.length : trucks.filter(tr=>tr.status===s).length})
          </button>
        ))}
      </div>

      {/* Truck grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {loading ? <div style={{ color:'#bbb' }}>{t('loading', lang)}</div> :
         filtered.length === 0 ? <div style={{ color:'#bbb' }}>{lang==='zh'?'未找到车辆':'No trucks found.'}</div> :
         filtered.map(tr => {
          const daysLeft = serviceDaysLeft(tr.next_service)
          const serviceUrgent = daysLeft !== null && daysLeft <= 7
          const serviceWarning = daysLeft !== null && daysLeft <= 30 && daysLeft > 7
          return (
            <div key={tr.id} className="card" style={{ padding:18, borderTop:`3px solid ${tr.status==='active'?'#e53935':tr.status==='out_of_service'?'#ccc':'#f57f17'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:'Bebas Neue', fontSize:26, letterSpacing:1, color:'#e53935', lineHeight:1 }}>{tr.truck_number}</div>
                  <div style={{ fontWeight:700, fontSize:15, marginTop:2, color:'#111' }}>{tr.model}</div>
                </div>
                <span className={`badge-${tr.status}`} style={{ fontSize:10, padding:'4px 10px', borderRadius:20, fontWeight:700 }}>{STATUS_LABEL[tr.status]}</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:5, fontSize:12, color:'#888', marginBottom:14 }}>
                <div>🪪 <span style={{ color:'#444' }}>{tr.plate}</span></div>
                {tr.vin && <div>🔑 <span style={{ color:'#444', fontFamily:'JetBrains Mono', fontSize:11 }}>{tr.vin}</span></div>}
                {tr.last_service && <div>🔧 <span style={{ color:'#444' }}>{lang==='zh'?'上次保养: ':'Last service: '}{format(new Date(tr.last_service),'MMM d, yyyy')}</span></div>}
                {tr.next_service && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span>📅</span>
                    <span style={{ color: serviceUrgent ? '#c62828' : serviceWarning ? '#f57f17' : '#444', fontWeight: (serviceUrgent||serviceWarning) ? 700 : 400 }}>
                      {lang==='zh'?'下次保养: ':'Next service: '}{format(new Date(tr.next_service),'MMM d, yyyy')}
                      {daysLeft !== null && (
                        <span style={{ marginLeft:6, fontSize:10, padding:'1px 6px', borderRadius:10,
                          background: serviceUrgent ? '#ffebee' : serviceWarning ? '#fff8e1' : '#e8f5e9',
                          color:      serviceUrgent ? '#c62828' : serviceWarning ? '#f57f17' : '#2e7d32',
                          border:     `1px solid ${serviceUrgent ? '#ef9a9a' : serviceWarning ? '#ffe082' : '#a5d6a7'}`,
                        }}>
                          {daysLeft < 0 ? (lang==='zh'?'已逾期':'OVERDUE') : daysLeft === 0 ? (lang==='zh'?'今天':'TODAY') : `${daysLeft}d`}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-ghost" onClick={() => openEdit(tr)} style={{ flex:1, padding:'7px', fontSize:13 }}>{t('edit', lang)}</button>
                <button onClick={() => setDeleteId(tr.id)} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #ef9a9a', background:'#ffebee', color:'#c62828', cursor:'pointer', fontSize:13 }}>🗑</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="card" style={{ width:'100%', maxWidth:500, padding:26, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:4, height:24, background:'#e53935', borderRadius:2 }} />
              <span style={{ fontFamily:'Bebas Neue', fontSize:20, letterSpacing:1, color:'#111' }}>{editTruck ? t('editTruck', lang) : t('addNewTruck', lang)}</span>
            </div>
            <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label>{t('truckNumber', lang)} *</label><input placeholder="T-001" value={form.truck_number} onChange={e => set('truck_number',e.target.value)} required /></div>
                <div><label>{t('plate', lang)} *</label><input placeholder="GR-1234-24" value={form.plate} onChange={e => set('plate',e.target.value)} required /></div>
              </div>
              <div><label>{t('model', lang)} *</label><input placeholder="Tonly NX300" value={form.model} onChange={e => set('model',e.target.value)} required /></div>
              <div><label>{t('vin', lang)}</label><input placeholder={lang==='zh'?'可选':'Optional'} value={form.vin} onChange={e => set('vin',e.target.value)} /></div>
              <div>
                <label>{t('status', lang)}</label>
                <select value={form.status} onChange={e => set('status',e.target.value)}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label>{t('lastService', lang)}</label><input type="date" value={form.last_service} onChange={e => set('last_service',e.target.value)} /></div>
                <div><label>{t('nextService', lang)}</label><input type="date" value={form.next_service} onChange={e => set('next_service',e.target.value)} /></div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex:1 }}>{saving ? t('saving', lang) : editTruck ? t('updateTruck', lang) : t('addTruck', lang)}</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex:1 }}>{t('cancel', lang)}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div className="card" style={{ padding:28, maxWidth:340, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
            <div style={{ fontFamily:'Bebas Neue', fontSize:20, marginBottom:8, color:'#111' }}>{t('deleteTruck', lang)}</div>
            <div style={{ fontSize:13, color:'#888', marginBottom:20 }}>{t('deleteTruckWarn', lang)}</div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-primary" onClick={confirmDelete} style={{ flex:1 }}>{t('yesDelete', lang)}</button>
              <button className="btn-ghost" onClick={() => setDeleteId(null)} style={{ flex:1 }}>{t('cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
