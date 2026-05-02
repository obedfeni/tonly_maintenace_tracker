'use client'
import { useEffect, useState } from 'react'
import { supabase, MaintenanceTask, TaskStatus } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { format } from 'date-fns'

const FREQ_TASKS: Record<string, string[]> = {
  daily: ['Engine oil check','Tire pressure check','Lights inspection','Brake air pressure','Fuel leaks check','Coolant level'],
  weekly: ['Battery test','Greasing joints','Suspension inspection','Air filter check','Hydraulic fluid'],
  monthly: ['Oil change','Brake pads inspection','Transmission check','Hydraulic system','Drive belt check'],
  quarterly: ['Full servicing','Wheel alignment','AC system check','Exhaust inspection'],
  yearly: ['Major overhaul','Roadworthiness inspection','Engine tune-up'],
}

export default function TasksPage() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [trucks, setTrucks] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [form, setForm] = useState({ truck_id:'', assigned_to:'', title:'', description:'', frequency:'daily', due_date: format(new Date(),'yyyy-MM-dd') })
  const [saving, setSaving] = useState(false)
  const [noteModal, setNoteModal] = useState<any>(null)
  const [noteText, setNoteText] = useState('')

  const isTech = profile?.role === 'technician'
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { loadAll() }, [filter])

  async function loadAll() {
    let q = supabase.from('maintenance_tasks')
      .select('*, truck:trucks(truck_number,model), assignee:profiles!assigned_to(full_name), completer:profiles!completed_by(full_name)')
      .order('due_date', { ascending: true })
    if (filter !== 'all') q = q.eq('status', filter)
    if (isTech) q = q.eq('assigned_to', profile!.id)
    const { data } = await q
    setTasks(data || [])
    const [t, p] = await Promise.all([
      supabase.from('trucks').select('id,truck_number,model,status').order('truck_number'),
      supabase.from('profiles').select('id,full_name,role').eq('role','technician'),
    ])
    setTrucks(t.data || [])
    setTeam(p.data || [])
    setLoading(false)
  }

  async function saveTask(e: any) {
    e.preventDefault(); setSaving(true)
    await supabase.from('maintenance_tasks').insert({ ...form, status: 'pending' })
    setShowForm(false); setForm({ truck_id:'', assigned_to:'', title:'', description:'', frequency:'daily', due_date: format(new Date(),'yyyy-MM-dd') })
    await loadAll(); setSaving(false)
  }

  async function updateStatus(id: string, status: TaskStatus) {
    const update: any = { status }
    if (status === 'completed') { update.completed_at = new Date().toISOString(); update.completed_by = profile!.id }
    await supabase.from('maintenance_tasks').update(update).eq('id', id)
    await loadAll()
  }

  async function saveNote() {
    await supabase.from('maintenance_tasks').update({ notes: noteText }).eq('id', noteModal.id)
    setNoteModal(null); setNoteText(''); await loadAll()
  }

  const statusColors: Record<string, string> = { all:'#8888aa', pending:'#fbbf24', in_progress:'#60a5fa', completed:'#4ade80', overdue:'#f87171' }
  const filters = ['all','pending','in_progress','completed','overdue']

  return (
    <div style={{ padding:32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2 }}>MAINTENANCE <span style={{ color:'#f97316' }}>TASKS</span></div>
          <div style={{ color:'#555570', fontSize:13 }}>{tasks.length} tasks · Live updates</div>
        </div>
        {!isTech && <button className="btn-primary" onClick={() => setShowForm(true)}>+ New Task</button>}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 16px', borderRadius:20, border:'1px solid', cursor:'pointer', fontSize:13, fontWeight:600, textTransform:'capitalize', transition:'all 0.2s',
            background: filter === f ? statusColors[f] : 'transparent',
            color: filter === f ? '#0a0a0f' : statusColors[f],
            borderColor: statusColors[f] + '60' }}>
            {f.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? <div style={{ color:'#333350', textAlign:'center', padding:40 }}>Loading...</div> :
         tasks.length === 0 ? <div style={{ color:'#333350', textAlign:'center', padding:40 }}>No tasks found.</div> :
         tasks.map(task => (
          <div key={task.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontWeight:600, fontSize:15 }}>{task.title}</div>
              <div style={{ fontSize:12, color:'#555570', marginTop:3 }}>
                🚛 {task.truck?.truck_number} {task.truck?.model} · 📅 Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                {task.assignee && <> · 👤 {task.assignee.full_name}</>}
              </div>
              {task.notes && <div style={{ fontSize:12, color:'#8888aa', marginTop:4, fontStyle:'italic' }}>📝 {task.notes}</div>}
              {task.completed_at && <div style={{ fontSize:11, color:'#4ade80', marginTop:4 }}>✔ Completed {format(new Date(task.completed_at),'MMM d h:mm a')}{task.completer && ` by ${task.completer.full_name}`}</div>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span className={`badge-${task.frequency}`} style={{ fontSize:10, padding:'3px 8px', borderRadius:4, background:'rgba(255,255,255,0.07)', color:'#8888aa', border:'1px solid rgba(255,255,255,0.1)' }}>{task.frequency.toUpperCase()}</span>
              <span className={`badge-${task.status}`} style={{ fontSize:11, padding:'5px 12px', borderRadius:20, fontWeight:600 }}>{task.status.replace('_',' ').toUpperCase()}</span>
              {task.status === 'pending' && isTech && (
                <button className="btn-ghost" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => updateStatus(task.id,'in_progress')}>Start</button>
              )}
              {task.status === 'in_progress' && (isTech || !isTech) && (
                <button className="btn-primary" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => updateStatus(task.id,'completed')}>Complete</button>
              )}
              <button className="btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => { setNoteModal(task); setNoteText(task.notes || '') }}>📝</button>
            </div>
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:520, padding:28, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:22, letterSpacing:1, marginBottom:20 }}>NEW MAINTENANCE TASK</div>
            <form onSubmit={saveTask} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label>Truck</label>
                <select value={form.truck_id} onChange={e => set('truck_id', e.target.value)} required>
                  <option value="">Select truck...</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.truck_number} — {t.model} ({t.status.replace(/_/g,' ')})</option>)}
                </select>
              </div>
              <div>
                <label>Task Name</label>
                <input placeholder="e.g. Engine oil check, Tire rotation..." value={form.title} onChange={e => set('title', e.target.value)} required />
                <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:6 }}>
                  {FREQ_TASKS[form.frequency]?.map(suggestion => (
                    <button key={suggestion} type="button" onClick={() => set('title', suggestion)}
                      style={{ padding:'4px 10px', borderRadius:20, border:'1px solid rgba(249,115,22,0.3)', background:'rgba(249,115,22,0.08)', color:'#fb923c', fontSize:11, cursor:'pointer', transition:'all 0.2s' }}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label>Frequency</label>
                  <select value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                    {['daily','weekly','monthly','quarterly','yearly'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} required />
                </div>
              </div>
              <div>
                <label>Assign To (Technician)</label>
                <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                  <option value="">Unassigned</option>
                  {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div>
                <label>Description (optional)</label>
                <textarea rows={2} placeholder="Task details..." value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex:1 }}>{saving ? 'Saving...' : 'Create Task'}</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:420, padding:24 }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:20, marginBottom:16 }}>ADD NOTE — {noteModal.title}</div>
            <textarea rows={4} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Enter your notes..." />
            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button className="btn-primary" onClick={saveNote} style={{ flex:1 }}>Save Note</button>
              <button className="btn-ghost" onClick={() => setNoteModal(null)} style={{ flex:1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
