'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, TaskStatus } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { format } from 'date-fns'

const SUGGESTIONS: Record<string, string[]> = {
  daily:     ['Engine oil check','Tire pressure check','Lights inspection','Brake air pressure','Fuel leaks check','Coolant level check'],
  weekly:    ['Battery test','Greasing all joints','Suspension inspection','Air filter check','Hydraulic fluid level'],
  monthly:   ['Oil change','Brake pads inspection','Transmission check','Hydraulic system service','Drive belt check'],
  quarterly: ['Full servicing','Wheel alignment','AC system check','Exhaust inspection'],
  yearly:    ['Major overhaul','Roadworthiness inspection','Engine tune-up'],
}

const FILTERS = ['all','pending','in_progress','completed','overdue']
const FILTER_COLORS: Record<string,string> = { all:'#888', pending:'#f57f17', in_progress:'#1565c0', completed:'#2e7d32', overdue:'#c62828' }
const STATUS_BAR: Record<string,string> = { pending:'#ffe082', in_progress:'#90caf9', completed:'#a5d6a7', overdue:'#ef9a9a' }
const EMPTY = { truck_id:'', assigned_to:'', title:'', description:'', frequency:'daily', due_date: format(new Date(),'yyyy-MM-dd') }

export default function TasksPage() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const [tasks, setTasks] = useState<any[]>([])
  const [trucks, setTrucks] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [noteModal, setNoteModal] = useState<any>(null)
  const [noteText, setNoteText] = useState('')
  const [deleteId, setDeleteId] = useState<string|null>(null)

  const isTech = profile?.role === 'technician'
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const loadAll = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    let q = supabase.from('maintenance_tasks')
      .select('*, truck:trucks(truck_number,model), assignee:profiles!assigned_to(full_name), completer:profiles!completed_by(full_name)')
      .order('due_date', { ascending: true })
    if (filter !== 'all') q = q.eq('status', filter)
    if (isTech) q = q.eq('assigned_to', profile.id)
    const { data } = await q
    setTasks(data || [])
    const [tr, tm] = await Promise.all([
      supabase.from('trucks').select('id,truck_number,model,status').order('truck_number'),
      supabase.from('profiles').select('id,full_name').in('role',['technician','supervisor','senior_supervisor']),
    ])
    setTrucks(tr.data || [])
    setTeam(tm.data || [])
    setLoading(false)
  }, [profile, filter, isTech])

  useEffect(() => { loadAll() }, [loadAll])

  async function saveTask(e: any) {
    e.preventDefault()
    if (!form.truck_id || !form.title.trim()) return
    setSaving(true)
    const payload: any = { ...form, status:'pending' }
    if (!payload.assigned_to) delete payload.assigned_to
    await supabase.from('maintenance_tasks').insert(payload)
    setShowForm(false); setForm({ ...EMPTY }); await loadAll(); setSaving(false)
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

  async function deleteTask() {
    if (!deleteId) return
    await supabase.from('maintenance_tasks').delete().eq('id', deleteId)
    setDeleteId(null); await loadAll()
  }

  const FREQ_LABELS: Record<string,string> = { daily:'Daily', weekly:'Weekly', monthly:'Monthly', quarterly:'Quarterly', yearly:'Yearly' }

  return (
    <div style={{ padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e0e0e0', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2, color:'#111' }}>{t('maintenanceTasks',lang)}</div>
          <div style={{ color:'#888', fontSize:13 }}>{tasks.length} tasks</div>
        </div>
        {!isTech && <button className="btn-primary" onClick={() => setShowForm(true)}>{t('newTask',lang)}</button>}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'6px 16px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:700,
            textTransform:'capitalize', transition:'all 0.15s', fontFamily:'DM Sans,sans-serif',
            background: filter===f ? FILTER_COLORS[f] : '#fff',
            color: filter===f ? '#fff' : FILTER_COLORS[f],
            border: `1.5px solid ${FILTER_COLORS[f]}`
          }}>{t(f === 'in_progress' ? 'inProgress' : f, lang)}</button>
        ))}
      </div>

      {/* Task List */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {loading
          ? <div style={{ textAlign:'center', color:'#bbb', padding:40 }}>{t('loading',lang)}</div>
          : tasks.length === 0
            ? <div style={{ textAlign:'center', color:'#bbb', padding:40 }}>{t('noTasksFound',lang)}</div>
            : tasks.map(task => (
            <div key={task.id} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <div style={{ width:4, height:44, borderRadius:2, background:STATUS_BAR[task.status]||'#e0e0e0', flexShrink:0 }} />
              <div style={{ flex:1, minWidth:180 }}>
                <div style={{ fontWeight:600, fontSize:14, color:'#111' }}>{task.title}</div>
                <div style={{ fontSize:11, color:'#999', marginTop:3 }}>
                  🚛 {task.truck?.truck_number} {task.truck?.model}
                  &nbsp;·&nbsp;📅 {format(new Date(task.due_date),'MMM d, yyyy')}
                  {task.assignee && <>&nbsp;·&nbsp;👤 {task.assignee.full_name}</>}
                </div>
                {task.notes && <div style={{ fontSize:11, color:'#aaa', marginTop:3, fontStyle:'italic' }}>📝 {task.notes}</div>}
                {task.completed_at && (
                  <div style={{ fontSize:10, color:'#2e7d32', marginTop:3, fontWeight:600 }}>
                    ✔ {format(new Date(task.completed_at),'MMM d h:mm a')}{task.completer ? ` · ${task.completer.full_name}` : ''}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, background:'#f5f5f5', color:'#888', border:'1px solid #e0e0e0', fontWeight:700 }}>
                  {FREQ_LABELS[task.frequency]}
                </span>
                <span className={`badge-${task.status}`} style={{ fontSize:11, padding:'4px 10px', borderRadius:20, fontWeight:700 }}>
                  {task.status.replace('_',' ').toUpperCase()}
                </span>
                {task.status === 'pending' && isTech && (
                  <button className="btn-ghost" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => updateStatus(task.id,'in_progress')}>{t('start',lang)}</button>
                )}
                {task.status === 'in_progress' && (
                  <button className="btn-primary" style={{ padding:'5px 12px', fontSize:12 }} onClick={() => updateStatus(task.id,'completed')}>{t('complete',lang)}</button>
                )}
                <button className="btn-ghost" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => { setNoteModal(task); setNoteText(task.notes||'') }}>📝</button>
                {!isTech && (
                  <button onClick={() => setDeleteId(task.id)} style={{ padding:'5px 10px', borderRadius:7, border:'1px solid #ef9a9a', background:'#ffebee', color:'#c62828', cursor:'pointer', fontSize:12 }}>🗑</button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* New Task Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }} onClick={e => { if(e.target===e.currentTarget) setShowForm(false) }}>
          <div className="card" style={{ width:'100%', maxWidth:520, padding:26, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:4, height:24, background:'#e53935', borderRadius:2 }} />
              <span style={{ fontFamily:'Bebas Neue', fontSize:20, letterSpacing:1, color:'#111' }}>{t('newMainTask',lang)}</span>
            </div>
            <form onSubmit={saveTask} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label>{t('truck',lang)} *</label>
                <select value={form.truck_id} onChange={e => set('truck_id',e.target.value)} required>
                  <option value="">{t('selectTruck',lang)}</option>
                  {trucks.map(tr => <option key={tr.id} value={tr.id}>{tr.truck_number} — {tr.model} ({tr.status.replace(/_/g,' ')})</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label>{t('frequency',lang)}</label>
                  <select value={form.frequency} onChange={e => set('frequency',e.target.value)}>
                    {Object.entries(FREQ_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label>{t('dueDate',lang)} *</label>
                  <input type="date" value={form.due_date} onChange={e => set('due_date',e.target.value)} required />
                </div>
              </div>
              <div>
                <label>{t('taskName',lang)} *</label>
                <input placeholder={t('typeTaskName',lang)} value={form.title} onChange={e => set('title',e.target.value)} required />
                <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:5 }}>
                  {SUGGESTIONS[form.frequency]?.map(s => (
                    <button key={s} type="button" onClick={() => set('title',s)} style={{ padding:'3px 10px', borderRadius:20, border:'1px solid #ef9a9a', background:'#ffebee', color:'#c62828', fontSize:11, cursor:'pointer' }}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label>{t('assignTo',lang)}</label>
                <select value={form.assigned_to} onChange={e => set('assigned_to',e.target.value)}>
                  <option value="">{t('unassigned',lang)}</option>
                  {team.map(tm => <option key={tm.id} value={tm.id}>{tm.full_name}</option>)}
                </select>
              </div>
              <div>
                <label>{t('notes',lang)}</label>
                <textarea rows={2} placeholder="..." value={form.description} onChange={e => set('description',e.target.value)} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex:1 }}>{saving ? t('creating',lang) : t('createTask',lang)}</button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex:1 }}>{t('cancel',lang)}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }}>
          <div className="card" style={{ width:'100%', maxWidth:420, padding:24 }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:20, marginBottom:4, color:'#111' }}>{t('addNote',lang)}</div>
            <div style={{ fontSize:13, color:'#888', marginBottom:14 }}>{noteModal.title}</div>
            <textarea rows={4} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="..." />
            <div style={{ display:'flex', gap:10, marginTop:14 }}>
              <button className="btn-primary" onClick={saveNote} style={{ flex:1 }}>{t('saveNote',lang)}</button>
              <button className="btn-ghost" onClick={() => setNoteModal(null)} style={{ flex:1 }}>{t('cancel',lang)}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}>
          <div className="card" style={{ padding:28, maxWidth:340, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
            <div style={{ fontFamily:'Bebas Neue', fontSize:20, marginBottom:8, color:'#111' }}>{t('deleteTask',lang)}</div>
            <div style={{ fontSize:13, color:'#888', marginBottom:20 }}>{t('deleteWarning',lang)}</div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-primary" onClick={deleteTask} style={{ flex:1 }}>{t('yesDelete',lang)}</button>
              <button className="btn-ghost" onClick={() => setDeleteId(null)} style={{ flex:1 }}>{t('cancel',lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
