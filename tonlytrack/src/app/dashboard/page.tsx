'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { format } from 'date-fns'

interface Stats { totalTrucks:number; activeTrucks:number; inRepair:number; todayDue:number; todayCompleted:number; overdue:number }

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ totalTrucks:0, activeTrucks:0, inRepair:0, todayDue:0, todayCompleted:0, overdue:0 })
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [trucks, tasks, completed, overdue] = await Promise.all([
      supabase.from('trucks').select('status'),
      supabase.from('maintenance_tasks').select('id').eq('due_date', today).neq('status','completed'),
      supabase.from('maintenance_tasks').select('id').eq('due_date', today).eq('status','completed'),
      supabase.from('maintenance_tasks').select('id').eq('status','overdue'),
    ])
    const t = trucks.data || []
    setStats({
      totalTrucks: t.length,
      activeTrucks: t.filter(x => x.status === 'active').length,
      inRepair: t.filter(x => x.status === 'in_repair').length,
      todayDue: (tasks.data||[]).length,
      todayCompleted: (completed.data||[]).length,
      overdue: (overdue.data||[]).length,
    })
    const { data } = await supabase.from('maintenance_tasks')
      .select('*, truck:trucks(truck_number,model), assignee:profiles!assigned_to(full_name)')
      .order('created_at', { ascending: false }).limit(6)
    setRecentTasks(data || [])
    setLoading(false)
  }

  const statCards = [
    { label:'Total Trucks', value:stats.totalTrucks, color:'#60a5fa', icon:'🚛' },
    { label:'Active', value:stats.activeTrucks, color:'#4ade80', icon:'✅' },
    { label:'In Repair', value:stats.inRepair, color:'#fbbf24', icon:'🔧' },
    { label:'Due Today', value:stats.todayDue, color:'#f97316', icon:'📋' },
    { label:'Completed Today', value:stats.todayCompleted, color:'#4ade80', icon:'✔️' },
    { label:'Overdue', value:stats.overdue, color:'#f87171', icon:'⚠️' },
  ]

  return (
    <div style={{ padding:32 }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:'Bebas Neue', fontSize:36, letterSpacing:2 }}>
          WELCOME BACK, <span style={{ color:'#f97316' }}>{profile?.full_name?.split(' ')[0].toUpperCase()}</span>
        </div>
        <div style={{ color:'#555570', fontSize:14 }}>{format(new Date(), 'EEEE, MMMM d yyyy')} · {profile?.role?.replace(/_/g,' ')}</div>
      </div>

      {/* Stats Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16, marginBottom:32 }}>
        {statCards.map(c => (
          <div key={c.label} className="card" style={{ padding:20 }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{c.icon}</div>
            <div style={{ fontFamily:'Bebas Neue', fontSize:36, color:c.color, lineHeight:1 }}>{loading ? '—' : c.value}</div>
            <div style={{ fontSize:12, color:'#555570', marginTop:4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="card" style={{ padding:24 }}>
        <div style={{ fontFamily:'Bebas Neue', fontSize:20, letterSpacing:1, marginBottom:20, color:'#e2e2f0' }}>RECENT TASKS</div>
        {recentTasks.length === 0 ? (
          <div style={{ textAlign:'center', color:'#333350', padding:32 }}>No tasks yet. Add trucks and schedule maintenance.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {recentTasks.map(task => (
              <div key={task.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#111118', borderRadius:8, border:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{task.title}</div>
                  <div style={{ fontSize:12, color:'#555570', marginTop:2 }}>
                    {task.truck?.truck_number} · {task.truck?.model} · Due {format(new Date(task.due_date), 'MMM d')}
                  </div>
                </div>
                <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20 }} className={`badge-${task.status}`}>
                  {task.status.replace('_',' ').toUpperCase()}
                </span>
                <span style={{ fontSize:11, padding:'4px 8px', borderRadius:6, background:'rgba(255,255,255,0.05)', color:'#8888aa' }}>{task.frequency}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
