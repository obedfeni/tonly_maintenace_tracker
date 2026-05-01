'use client'
import { useEffect, useState } from 'react'
import { supabase, Profile } from '@/lib/supabase'

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*, tasks:maintenance_tasks(status)').order('role')
      setTeam(data || []); setLoading(false)
    }
    load()
  }, [])

  const roleColor: Record<string, string> = {
    technician: '#60a5fa',
    supervisor: '#a78bfa',
    senior_supervisor: '#f97316'
  }

  const roleIcon: Record<string, string> = {
    technician: '🔧',
    supervisor: '👔',
    senior_supervisor: '⭐'
  }

  return (
    <div style={{ padding:32 }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:'Bebas Neue', fontSize:32, letterSpacing:2 }}>TEAM <span style={{ color:'#f97316' }}>MEMBERS</span></div>
        <div style={{ color:'#555570', fontSize:13 }}>{team.length} members registered</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
        {loading ? <div style={{ color:'#333350' }}>Loading...</div> :
         team.map(member => {
          const tasks = member.tasks || []
          const completed = tasks.filter((t: any) => t.status === 'completed').length
          const pending = tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length
          return (
            <div key={member.id} className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:`${roleColor[member.role]}20`, border:`2px solid ${roleColor[member.role]}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                  {roleIcon[member.role]}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:15 }}>{member.full_name}</div>
                  <div style={{ fontSize:11, color: roleColor[member.role], fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{member.role.replace(/_/g,' ')}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'#555570', marginBottom:12 }}>✉️ {member.email}</div>
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ flex:1, textAlign:'center', background:'rgba(34,197,94,0.08)', borderRadius:8, padding:'10px 0', border:'1px solid rgba(34,197,94,0.15)' }}>
                  <div style={{ fontFamily:'Bebas Neue', fontSize:24, color:'#4ade80' }}>{completed}</div>
                  <div style={{ fontSize:10, color:'#4ade80', opacity:0.8 }}>COMPLETED</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'rgba(249,115,22,0.08)', borderRadius:8, padding:'10px 0', border:'1px solid rgba(249,115,22,0.15)' }}>
                  <div style={{ fontFamily:'Bebas Neue', fontSize:24, color:'#f97316' }}>{pending}</div>
                  <div style={{ fontSize:10, color:'#f97316', opacity:0.8 }}>PENDING</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
