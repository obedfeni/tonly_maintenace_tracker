'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReportsPage() {
  const [data, setData] = useState<any>({ tasksByStatus:{}, tasksByFreq:{}, trucksByStatus:{}, techPerf:[], topTrucks:[] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [tasks, trucks, profiles] = await Promise.all([
        supabase.from('maintenance_tasks').select('status,frequency,truck_id,completed_by,assigned_to'),
        supabase.from('trucks').select('id,truck_number,model,status'),
        supabase.from('profiles').select('id,full_name,role').eq('role','technician'),
      ])
      const t = tasks.data || []
      const tr = trucks.data || []
      const p = profiles.data || []

      const tasksByStatus = t.reduce((a: any, x) => { a[x.status] = (a[x.status]||0)+1; return a }, {})
      const tasksByFreq = t.reduce((a: any, x) => { a[x.frequency] = (a[x.frequency]||0)+1; return a }, {})
      const trucksByStatus = tr.reduce((a: any, x) => { a[x.status] = (a[x.status]||0)+1; return a }, {})

      const techPerf = p.map(tech => ({
        name: tech.full_name,
        assigned: t.filter(x => x.assigned_to === tech.id).length,
        completed: t.filter(x => x.completed_by === tech.id).length,
      })).sort((a,b) => b.completed - a.completed)

      const truckTaskCounts = tr.map(truck => ({
        label: truck.truck_number,
        model: truck.model,
        total: t.filter(x => x.truck_id === truck.id).length,
        completed: t.filter(x => x.truck_id === truck.id && x.status === 'completed').length,
        overdue: t.filter(x => x.truck_id === truck.id && x.status === 'overdue').length,
      })).sort((a,b) => b.total - a.total).slice(0,8)

      setData({ tasksByStatus, tasksByFreq, trucksByStatus, techPerf, topTrucks: truckTaskCounts })
      setLoading(false)
    }
    load()
  }, [])

  const StatRow = ({ label, value, color }: any) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize:14, color:'#8888aa', textTransform:'capitalize' }}>{label.replace(/_/g,' ')}</span>
      <span style={{ fontFamily:'Bebas Neue', fontSize:22, color: color || '#e2e2f0' }}>{value}</span>
    </div>
  )

  return (
    <div style={{ padding:32 }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2 }}>PERFORMANCE <span style={{ color:'#f97316' }}>REPORTS</span></div>
        <div style={{ color:'#555570', fontSize:13 }}>Maintenance analytics overview</div>
      </div>

      {loading ? <div style={{ color:'#333350', textAlign:'center', padding:60 }}>Loading reports...</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>

          <div className="card" style={{ padding:20 }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:1, marginBottom:16, color:'#f97316' }}>TASKS BY STATUS</div>
            {Object.entries(data.tasksByStatus).map(([k, v]: any) => (
              <StatRow key={k} label={k} value={v} color={k==='completed'?'#4ade80':k==='overdue'?'#f87171':k==='in_progress'?'#60a5fa':'#fbbf24'} />
            ))}
          </div>

          <div className="card" style={{ padding:20 }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:1, marginBottom:16, color:'#f97316' }}>TASKS BY FREQUENCY</div>
            {Object.entries(data.tasksByFreq).map(([k, v]: any) => <StatRow key={k} label={k} value={v} />)}
          </div>

          <div className="card" style={{ padding:20 }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:1, marginBottom:16, color:'#f97316' }}>FLEET STATUS</div>
            {Object.entries(data.trucksByStatus).map(([k, v]: any) => (
              <StatRow key={k} label={k} value={v} color={k==='active'?'#4ade80':k==='out_of_service'?'#f87171':'#fbbf24'} />
            ))}
          </div>

          <div className="card" style={{ padding:20, gridColumn:'span 1' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:1, marginBottom:16, color:'#f97316' }}>TECHNICIAN PERFORMANCE</div>
            {data.techPerf.length === 0
              ? <div style={{ color:'#333350', fontSize:13 }}>No technician data yet.</div>
              : data.techPerf.map((tech: any) => (
                <div key={tech.name} style={{ padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:14, fontWeight:600 }}>{tech.name}</span>
                    <span style={{ fontSize:12, color:'#4ade80', fontWeight:600 }}>{tech.completed}/{tech.assigned} done</span>
                  </div>
                  <div style={{ height:6, background:'#1a1a24', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg,#f97316,#ea580c)', borderRadius:3, width: tech.assigned ? `${Math.round(tech.completed/tech.assigned*100)}%` : '0%', transition:'width 0.5s' }} />
                  </div>
                </div>
              ))
            }
          </div>

          <div className="card" style={{ padding:20, gridColumn:'span 2' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:1, marginBottom:16, color:'#f97316' }}>TOP TRUCKS BY MAINTENANCE ACTIVITY</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ color:'#555570' }}>
                    {['Truck','Model','Total','Completed','Overdue'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontWeight:600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topTrucks.map((t: any) => (
                    <tr key={t.label} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding:'10px 12px', color:'#f97316', fontWeight:700 }}>{t.label}</td>
                      <td style={{ padding:'10px 12px', color:'#c0c0d8' }}>{t.model}</td>
                      <td style={{ padding:'10px 12px', fontFamily:'Bebas Neue', fontSize:18 }}>{t.total}</td>
                      <td style={{ padding:'10px 12px', color:'#4ade80', fontFamily:'Bebas Neue', fontSize:18 }}>{t.completed}</td>
                      <td style={{ padding:'10px 12px', color:'#f87171', fontFamily:'Bebas Neue', fontSize:18 }}>{t.overdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
