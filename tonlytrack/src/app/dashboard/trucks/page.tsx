'use client'
import { useEffect, useState } from 'react'
import { supabase, Truck, TruckStatus } from '@/lib/supabase'
import { format } from 'date-fns'

const STATUS_OPTS: TruckStatus[] = ['active','in_repair','awaiting_parts','out_of_service']

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTruck, setEditTruck] = useState<Truck | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ truck_number:'', plate:'', model:'', vin:'', mileage:'0', status:'active' as TruckStatus, last_service:'', next_service:'' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('trucks').select('*').order('truck_number')
    setTrucks(data || []); setLoading(false)
  }

  function openEdit(t: Truck) {
    setEditTruck(t)
    setForm({ truck_number:t.truck_number, plate:t.plate, model:t.model, vin:t.vin, mileage:String(t.mileage), status:t.status, last_service:t.last_service||'', next_service:t.next_service||'' })
    setShowForm(true)
  }

  async function save(e: any) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, mileage: parseInt(form.mileage) }
    if (editTruck) await supabase.from('trucks').update(payload).eq('id', editTruck.id)
    else await supabase.from('trucks').insert(payload)
    setShowForm(false); setEditTruck(null); await load(); setSaving(false)
  }

  async function deleteTruck(id: string) {
    if (!confirm('Delete this truck?')) return
    await supabase.from('trucks').delete().eq('id', id)
    await load()
  }

  const filtered = trucks.filter(t =>
    t.truck_number.toLowerCase().includes(search.toLowerCase()) ||
    t.model.toLowerCase().includes(search.toLowerCase()) ||
    t.plate.toLowerCase().includes(search.toLowerCase())
  )

  const counts = STATUS_OPTS.map(s => ({ s, n: trucks.filter(t => t.status === s).length }))

  return (
    <div style={{ padding:32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2 }}>FLEET <span style={{ color:'#f97316' }}>MANAGEMENT</span></div>
          <div style={{ color:'#555570', fontSize:13 }}>{trucks.length} trucks registered</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <input placeholder="Search trucks..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:200 }} />
          <button className="btn-primary" onClick={() => { setEditTruck(null); setForm({ truck_number:'', plate:'', model:'', vin:'', mileage:'0', status:'active', last_service:'', next_service:'' }); setShowForm(true) }}>+ Add Truck</button>
        </div>
      </div>

      {/* Status summary */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        {counts.map(({ s, n }) => (
          <div key={s} className="card" style={{ padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
            <span className={`badge-${s}`} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, fontWeight:700 }}>{s.replace(/_/g,' ').toUpperCase()}</span>
            <span style={{ fontFamily:'Bebas Neue', fontSize:22, color:'#e2e2f0' }}>{n}</span>
          </div>
        ))}
      </div>

      {/* Truck cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {loading ? <div style={{ color:'#333350' }}>Loading...</div> :
         filtered.length === 0 ? <div style={{ color:'#333350' }}>No trucks found.</div> :
         filtered.map(truck => (
          <div key={truck.id} className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontFamily:'Bebas Neue', fontSize:24, letterSpacing:1, color:'#f97316' }}>{truck.truck_number}</div>
                <div style={{ fontWeight:600, fontSize:15, color:'#e2e2f0' }}>{truck.model}</div>
              </div>
              <span className={`badge-${truck.status}`} style={{ fontSize:11, padding:'4px 10px', borderRadius:20, fontWeight:600 }}>{truck.status.replace(/_/g,' ')}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13, color:'#8888aa', marginBottom:16 }}>
              <div>🪪 Plate: <span style={{ color:'#c0c0d8' }}>{truck.plate}</span></div>
              <div>🔑 VIN: <span style={{ color:'#c0c0d8', fontFamily:'JetBrains Mono', fontSize:11 }}>{truck.vin}</span></div>
              <div>🛣 Mileage: <span style={{ color:'#c0c0d8' }}>{truck.mileage.toLocaleString()} km</span></div>
              {truck.last_service && <div>🔧 Last service: <span style={{ color:'#c0c0d8' }}>{format(new Date(truck.last_service),'MMM d, yyyy')}</span></div>}
              {truck.next_service && <div>📅 Next due: <span style={{ color:'#f97316' }}>{format(new Date(truck.next_service),'MMM d, yyyy')}</span></div>}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-ghost" onClick={() => openEdit(truck)} style={{ flex:1, padding:'7px' }}>✏️ Edit</button>
              <button onClick={() => deleteTruck(truck.id)} style={{ padding:'7px 12px', borderRadius:8, border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.08)', color:'#f87171', cursor:'pointer', fontSize:13 }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:520, padding:28, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:22, marginBottom:20 }}>{editTruck ? 'EDIT TRUCK' : 'ADD NEW TRUCK'}</div>
            <form onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label>Truck Number</label><input placeholder="T-001" value={form.truck_number} onChange={e => set('truck_number',e.target.value)} required /></div>
                <div><label>Plate</label><input placeholder="GR-1234-24" value={form.plate} onChange={e => set('plate',e.target.value)} required /></div>
              </div>
              <div><label>Model</label><input placeholder="Tonly NX300" value={form.model} onChange={e => set('model',e.target.value)} required /></div>
              <div><label>VIN / Serial Number</label><input placeholder="VIN..." value={form.vin} onChange={e => set('vin',e.target.value)} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label>Mileage (km)</label><input type="number" value={form.mileage} onChange={e => set('mileage',e.target.value)} /></div>
                <div><label>Status</label>
                  <select value={form.status} onChange={e => set('status',e.target.value)}>
                    {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label>Last Service Date</label><input type="date" value={form.last_service} onChange={e => set('last_service',e.target.value)} /></div>
                <div><label>Next Service Due</label><input type="date" value={form.next_service} onChange={e => set('next_service',e.target.value)} /></div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex:1 }}>{saving ? 'Saving...' : editTruck ? 'Update Truck' : 'Add Truck'}</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
