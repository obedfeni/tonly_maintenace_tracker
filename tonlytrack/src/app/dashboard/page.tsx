'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { format } from 'date-fns'

export default function Dashboard() {
  const { profile } = useAuth()
  const { lang } = useLang()
  const [stats, setStats] = useState({ totalTrucks:0, activeTrucks:0, inRepair:0, todayDue:0, todayCompleted:0, overdue:0 })
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [recentFaults, setRecentFaults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [trucks, due, done, ovd, tasks, faults] = await Promise.all([
      supabase.from('trucks').select('status'),
      supabase.from('maintenance_tasks').select('id', { count:'exact' }).eq('due_date', today).neq('status','completed'),
      supabase.from('maintenance_tasks').select('id', { count:'exact' }).eq('due_date', today).eq('status','completed'),
      supabase.from('maintenance_tasks').select('id', { count:'exact' }).eq('status','overdue'),
      supabase.from('maintenance_tasks').select('*, truck:trucks(truck_number,model)').order('created_at',{ascending:false}).limit(5),
      supabase.from('fault_reports').select('*, truck:trucks(truck_number)').eq('resolved',false).order('created_at',{ascending:false}).limit(4),
    ])
    const tr = trucks.data || []
    setStats({ totalTrucks:tr.length, activeTrucks:tr.filter(x=>x.status==='active').length, inRepair:tr.filter(x=>x.status==='in_repair').length, todayDue:due.count||0, todayCompleted:done.count||0, overdue:ovd.count||0 })
    setRecentTasks(tasks.data || [])
    setRecentFaults(faults.data || [])
    setLoading(false)
  }

  const cards = [
    { key:'totalFleet',      value:stats.totalTrucks,    icon:'🚛', border:'#e0e0e0', iconBg:'#f5f5f5' },
    { key:'activeTrucks',    value:stats.activeTrucks,   icon:'✅', border:'#a5d6a7', iconBg:'#e8f5e9' },
    { key:'inRepair',        value:stats.inRepair,       icon:'🔧', border:'#ffe082', iconBg:'#fff8e1' },
    { key:'dueToday',        value:stats.todayDue,       icon:'📋', border:'#ef9a9a', iconBg:'#ffebee' },
    { key:'completedToday',  value:stats.todayCompleted, icon:'✔️', border:'#a5d6a7', iconBg:'#e8f5e9' },
    { key:'overdue',         value:stats.overdue,        icon:'⚠️', border:'#ef9a9a', iconBg:'#ffebee' },
  ]

  const statusColor: Record<string,string> = { pending:'#f57f17', in_progress:'#1565c0', completed:'#2e7d32', overdue:'#c62828' }

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e0e0e0' }}>
        <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2, color:'#111' }}>
          {t('welcome',lang)}, <span style={{ color:'#e53935' }}>{profile?.full_name?.split(' ')[0].toUpperCase()}</span>
        </div>
        <div style={{ color:'#888', fontSize:13, marginTop:3 }}>
          {format(new Date(),'EEEE, MMMM d yyyy')} &nbsp;·&nbsp;
          <span style={{ color:'#e53935', fontWeight:600 }}>{profile?.role?.replace(/_/g,' ')}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
        {cards.map(c => (
          <div key={c.key} className="card" style={{ padding:18, borderTop:`3px solid ${c.border}` }}>
            <div style={{ width:36, height:36, borderRadius:9, background:c.iconBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:10 }}>{c.icon}</div>
            <div style={{ fontFamily:'Bebas Neue', fontSize:36, color:'#111', lineHeight:1 }}>{loading ? '—' : c.value}</div>
            <div style={{ fontSize:11, color:'#888', marginTop:4, fontWeight:600, textTransform:'uppercase', letterSpacing:0.3 }}>{t(c.key, lang)}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, alignItems:'start' }}>
        {/* Recent Tasks */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontFamily:'Bebas Neue', fontSize:17, letterSpacing:1, color:'#111' }}>{t('recentTasks',lang)}</span>
            <a href="/dashboard/tasks" style={{ fontSize:12, color:'#e53935', fontWeight:700, textDecoration:'none' }}>{t('viewAll',lang)}</a>
          </div>
          {recentTasks.length === 0
            ? <div style={{ color:'#bbb', textAlign:'center', padding:28, fontSize:13 }}>{t('noTasks',lang)}</div>
            : recentTasks.map(task => (
              <div key={task.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f0f0f0' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:statusColor[task.status]||'#ccc', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{task.title}</div>
                  <div style={{ fontSize:11, color:'#999', marginTop:1 }}>{task.truck?.truck_number} · {format(new Date(task.due_date),'MMM d')}</div>
                </div>
                <span className={`badge-${task.status}`} style={{ fontSize:10, padding:'3px 8px', borderRadius:20, fontWeight:700, flexShrink:0 }}>{task.status.replace('_',' ')}</span>
              </div>
            ))}
        </div>

        {/* Open Faults */}
        <div className="card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontFamily:'Bebas Neue', fontSize:17, letterSpacing:1, color:'#e53935' }}>{t('openFaults',lang)}</span>
            <a href="/dashboard/faults" style={{ fontSize:12, color:'#e53935', fontWeight:700, textDecoration:'none' }}>{t('viewAll',lang)}</a>
          </div>
          {recentFaults.length === 0
            ? <div style={{ color:'#bbb', textAlign:'center', padding:20, fontSize:13 }}>✅ {t('noFaults',lang)}</div>
            : recentFaults.map(f => (
              <div key={f.id} style={{ padding:'9px 0', borderBottom:'1px solid #f0f0f0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:f.severity==='high'?'#c62828':f.severity==='medium'?'#f57f17':'#2e7d32' }} />
                  <span style={{ fontSize:10, fontWeight:700, color:f.severity==='high'?'#c62828':f.severity==='medium'?'#f57f17':'#2e7d32', textTransform:'uppercase' }}>{f.severity}</span>
                  <span style={{ fontSize:11, color:'#aaa' }}>{f.truck?.truck_number}</span>
                </div>
                <div style={{ fontSize:12, color:'#555', paddingLeft:15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.description}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
