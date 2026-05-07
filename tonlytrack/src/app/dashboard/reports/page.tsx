'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'

export default function ReportsPage() {
  const { lang } = useLang()
  const [rep, setRep] = useState<any>({ byStatus:{}, byFreq:{}, byTruckStatus:{}, techPerf:[], truckActivity:[] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [tasks, trucks, profiles] = await Promise.all([
        supabase.from('maintenance_tasks').select('status,frequency,truck_id,completed_by,assigned_to'),
        supabase.from('trucks').select('id,truck_number,model,status'),
        supabase.from('profiles').select('id,full_name').in('role',['technician','supervisor']),
      ])
      const tsk = tasks.data||[], tr = trucks.data||[], p = profiles.data||[]
      const count = (arr:any[], k:string) => arr.reduce((a:any,x:any) => { a[x[k]]=(a[x[k]]||0)+1; return a }, {})
      const techPerf = p.map(u => ({
        name: u.full_name,
        assigned:  tsk.filter(x => x.assigned_to === u.id).length,
        completed: tsk.filter(x => x.completed_by === u.id).length,
      })).sort((a,b) => b.completed - a.completed)
      const truckActivity = tr.map(truck => ({
        number:truck.truck_number, model:truck.model, status:truck.status,
        total:     tsk.filter(x => x.truck_id === truck.id).length,
        completed: tsk.filter(x => x.truck_id === truck.id && x.status==='completed').length,
        overdue:   tsk.filter(x => x.truck_id === truck.id && x.status==='overdue').length,
      })).sort((a,b) => b.total - a.total)
      setRep({ byStatus:count(tsk,'status'), byFreq:count(tsk,'frequency'), byTruckStatus:count(tr,'status'), techPerf, truckActivity })
      setLoading(false)
    }
    load()
  }, [])

  const STATUS_COLOR: Record<string,string> = { completed:'#2e7d32', pending:'#f57f17', in_progress:'#1565c0', overdue:'#c62828' }
  const TRUCK_STATUS_COLOR: Record<string,string> = { active:'#2e7d32', in_repair:'#f57f17', awaiting_parts:'#e65100', out_of_service:'#757575' }

  const StatRow = ({ label, value, color }: any) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #f5f5f5' }}>
      <span style={{ fontSize:13, color:'#555', textTransform:'capitalize' }}>{String(label).replace(/_/g,' ')}</span>
      <span style={{ fontFamily:'Bebas Neue', fontSize:22, color: color||'#111' }}>{value}</span>
    </div>
  )

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e0e0e0' }}>
        <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2, color:'#111' }}>{t('perfReports',lang)}</div>
        <div style={{ color:'#888', fontSize:13 }}>{t('analytics',lang)}</div>
      </div>

      {loading ? <div style={{ color:'#bbb', textAlign:'center', padding:60 }}>{t('loading',lang)}</div> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>

          <div className="card" style={{ padding:20, borderTop:'3px solid #e53935' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:16, letterSpacing:1, marginBottom:12, color:'#e53935' }}>{t('tasksByStatus',lang)}</div>
            {!Object.keys(rep.byStatus).length ? <div style={{ color:'#bbb', fontSize:13 }}>{t('noData',lang)}</div>
              : Object.entries(rep.byStatus).map(([k,v]:any) => <StatRow key={k} label={k} value={v} color={STATUS_COLOR[k]} />)}
          </div>

          <div className="card" style={{ padding:20, borderTop:'3px solid #e53935' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:16, letterSpacing:1, marginBottom:12, color:'#e53935' }}>{t('tasksByFreq',lang)}</div>
            {!Object.keys(rep.byFreq).length ? <div style={{ color:'#bbb', fontSize:13 }}>{t('noData',lang)}</div>
              : Object.entries(rep.byFreq).map(([k,v]:any) => <StatRow key={k} label={k} value={v} />)}
          </div>

          <div className="card" style={{ padding:20, borderTop:'3px solid #e53935' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:16, letterSpacing:1, marginBottom:12, color:'#e53935' }}>{t('fleetStatus',lang)}</div>
            {!Object.keys(rep.byTruckStatus).length ? <div style={{ color:'#bbb', fontSize:13 }}>{t('noData',lang)}</div>
              : Object.entries(rep.byTruckStatus).map(([k,v]:any) => <StatRow key={k} label={k} value={v} color={TRUCK_STATUS_COLOR[k]} />)}
          </div>

          <div className="card" style={{ padding:20, borderTop:'3px solid #e53935' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:16, letterSpacing:1, marginBottom:12, color:'#e53935' }}>{t('techPerf',lang)}</div>
            {!rep.techPerf.length ? <div style={{ color:'#bbb', fontSize:13 }}>{t('noData',lang)}</div>
              : rep.techPerf.map((tech:any) => (
                <div key={tech.name} style={{ padding:'10px 0', borderBottom:'1px solid #f5f5f5' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#111' }}>{tech.name}</span>
                    <span style={{ fontSize:12, color:'#2e7d32', fontWeight:700 }}>{tech.completed}/{tech.assigned}</span>
                  </div>
                  <div style={{ height:6, background:'#f5f5f5', borderRadius:3, overflow:'hidden', border:'1px solid #e0e0e0' }}>
                    <div style={{ height:'100%', background:'linear-gradient(90deg,#e53935,#ef9a9a)', borderRadius:3, width: tech.assigned ? `${Math.min(100,Math.round(tech.completed/tech.assigned*100))}%` : '0%', transition:'width 0.6s' }} />
                  </div>
                </div>
              ))
            }
          </div>

          <div className="card" style={{ padding:20, gridColumn:'1 / -1', borderTop:'3px solid #e53935' }}>
            <div style={{ fontFamily:'Bebas Neue', fontSize:16, letterSpacing:1, marginBottom:12, color:'#e53935' }}>{t('truckActivity',lang)}</div>
            {!rep.truckActivity.length ? <div style={{ color:'#bbb', fontSize:13 }}>{t('noData',lang)}</div> : (
              <div style={{ overflowX:'auto' }}>
                <table>
                  <thead>
                    <tr>
                      {[lang==='zh'?'车辆':'Truck', lang==='zh'?'型号':'Model', lang==='zh'?'状态':'Status', lang==='zh'?'总任务':'Total', lang==='zh'?'已完成':'Done', lang==='zh'?'逾期':'Overdue', t('rate',lang)].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rep.truckActivity.map((tr:any) => (
                      <tr key={tr.number}>
                        <td style={{ color:'#e53935', fontWeight:700, fontFamily:'Bebas Neue', fontSize:16 }}>{tr.number}</td>
                        <td style={{ color:'#444' }}>{tr.model}</td>
                        <td><span className={`badge-${tr.status}`} style={{ fontSize:10, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{tr.status.replace(/_/g,' ')}</span></td>
                        <td style={{ fontFamily:'Bebas Neue', fontSize:18, color:'#111' }}>{tr.total}</td>
                        <td style={{ color:'#2e7d32', fontFamily:'Bebas Neue', fontSize:18 }}>{tr.completed}</td>
                        <td style={{ color: tr.overdue>0?'#c62828':'#bbb', fontFamily:'Bebas Neue', fontSize:18 }}>{tr.overdue}</td>
                        <td style={{ color:'#e53935', fontWeight:700 }}>{tr.total > 0 ? `${Math.round(tr.completed/tr.total*100)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
