'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'

const ROLE_COLOR: Record<string,string> = { technician:'#1565c0', supervisor:'#6a1b9a', senior_supervisor:'#c62828' }
const ROLE_ICON:  Record<string,string>  = { technician:'🔧', supervisor:'👔', senior_supervisor:'⭐' }
const ROLE_ORDER = ['senior_supervisor','supervisor','technician']

export default function TeamPage() {
  const { lang } = useLang()
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [profiles, tasks] = await Promise.all([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('maintenance_tasks').select('assigned_to,completed_by,status'),
      ])
      const tsk = tasks.data || []
      const members = (profiles.data || []).map(p => ({
        ...p,
        completed: tsk.filter((x:any) => x.completed_by === p.id).length,
        pending:   tsk.filter((x:any) => x.assigned_to === p.id && ['pending','in_progress'].includes(x.status)).length,
        total:     tsk.filter((x:any) => x.assigned_to === p.id).length,
      }))
      setTeam(members); setLoading(false)
    }
    load()
  }, [])

  const ROLE_LABEL: Record<string,string> = {
    technician:        lang==='zh' ? '技术员' : 'Technicians',
    supervisor:        lang==='zh' ? '主管'   : 'Supervisors',
    senior_supervisor: lang==='zh' ? '高级主管': 'Senior Supervisors',
  }

  return (
    <div style={{ padding:28 }}>
      <div style={{ marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e0e0e0' }}>
        <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2, color:'#111' }}>{t('teamMembers',lang)}</div>
        <div style={{ color:'#888', fontSize:13 }}>{team.length} {t('membersReg',lang)}</div>
      </div>

      {loading ? <div style={{ color:'#bbb', textAlign:'center', padding:40 }}>{t('loading',lang)}</div> :
       team.length === 0 ? <div style={{ color:'#bbb', textAlign:'center', padding:40 }}>{t('noMembers',lang)}</div> : (
        <div>
          {ROLE_ORDER.map(role => {
            const members = team.filter(m => m.role === role)
            if (!members.length) return null
            return (
              <div key={role} style={{ marginBottom:28 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, paddingLeft:4 }}>
                  <span>{ROLE_ICON[role]}</span>
                  <span style={{ fontFamily:'Bebas Neue', fontSize:16, letterSpacing:1, color: ROLE_COLOR[role] }}>{ROLE_LABEL[role]}</span>
                  <span style={{ fontSize:12, color:'#bbb', fontWeight:600, background:'#f5f5f5', padding:'1px 8px', borderRadius:20, border:'1px solid #e0e0e0' }}>{members.length}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
                  {members.map(m => (
                    <div key={m.id} className="card" style={{ padding:18, borderLeft:`3px solid ${ROLE_COLOR[m.role]}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', background:`${ROLE_COLOR[m.role]}15`, border:`2px solid ${ROLE_COLOR[m.role]}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                          {ROLE_ICON[m.role]}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.full_name}</div>
                          <div style={{ fontSize:10, color:ROLE_COLOR[m.role], fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, marginTop:1 }}>{m.role.replace(/_/g,' ')}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:'#aaa', marginBottom:12 }}>✉️ {m.email}</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <div style={{ flex:1, textAlign:'center', background:'#e8f5e9', borderRadius:8, padding:'8px 0', border:'1px solid #a5d6a7' }}>
                          <div style={{ fontFamily:'Bebas Neue', fontSize:22, color:'#2e7d32', lineHeight:1 }}>{m.completed}</div>
                          <div style={{ fontSize:9, color:'#2e7d32', marginTop:2, fontWeight:700 }}>{t('done',lang)}</div>
                        </div>
                        <div style={{ flex:1, textAlign:'center', background:'#fff8e1', borderRadius:8, padding:'8px 0', border:'1px solid #ffe082' }}>
                          <div style={{ fontFamily:'Bebas Neue', fontSize:22, color:'#f57f17', lineHeight:1 }}>{m.pending}</div>
                          <div style={{ fontSize:9, color:'#f57f17', marginTop:2, fontWeight:700 }}>{t('pending',lang)}</div>
                        </div>
                        <div style={{ flex:1, textAlign:'center', background:'#f5f5f5', borderRadius:8, padding:'8px 0', border:'1px solid #e0e0e0' }}>
                          <div style={{ fontFamily:'Bebas Neue', fontSize:22, color:'#888', lineHeight:1 }}>{m.total}</div>
                          <div style={{ fontSize:9, color:'#aaa', marginTop:2, fontWeight:700 }}>{t('total',lang)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
