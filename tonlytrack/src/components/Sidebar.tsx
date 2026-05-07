'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'

const NAV = [
  { href:'/dashboard',         icon:'📊', key:'dashboard',    roles:['technician','supervisor','senior_supervisor'] },
  { href:'/dashboard/tasks',   icon:'✅', key:'tasks',        roles:['technician','supervisor','senior_supervisor'] },
  { href:'/dashboard/trucks',  icon:'🚛', key:'fleet',        roles:['supervisor','senior_supervisor'] },
  { href:'/dashboard/faults',  icon:'⚠️', key:'faultReports', roles:['technician','supervisor','senior_supervisor'] },
  { href:'/dashboard/team',    icon:'👥', key:'team',         roles:['supervisor','senior_supervisor'] },
  { href:'/dashboard/reports', icon:'📈', key:'reports',      roles:['supervisor','senior_supervisor'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const { lang, setLang } = useLang()
  if (!profile) return null
  const links = NAV.filter(n => n.roles.includes(profile.role))

  return (
    <aside style={{ width:220, minHeight:'100vh', background:'#fff', borderRight:'1px solid #e0e0e0', display:'flex', flexDirection:'column', padding:'16px 10px', flexShrink:0, boxShadow:'2px 0 8px rgba(0,0,0,0.04)' }}>
      <div style={{ height:3, background:'linear-gradient(90deg,#e53935,#ef9a9a)', borderRadius:2, margin:'0 4px 20px 4px' }} />
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px', marginBottom:24 }}>
        <div style={{ width:34, height:34, background:'linear-gradient(135deg,#e53935,#c62828)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🚛</div>
        <div>
          <div style={{ fontFamily:'Bebas Neue', fontSize:18, letterSpacing:2, lineHeight:1, color:'#111' }}>TONLY<span style={{ color:'#e53935' }}>TRACK</span></div>
          <div style={{ fontSize:8, color:'#e53935', letterSpacing:1.5, fontWeight:700 }}>FLEET MAINTENANCE</div>
        </div>
      </div>
      <nav style={{ display:'flex', flexDirection:'column', gap:2, flex:1 }}>
        {links.map(item => (
          <Link key={item.href} href={item.href} className={`sidebar-link ${pathname===item.href?'active':''}`}>
            <span style={{ fontSize:15 }}>{item.icon}</span>
            <span>{t(item.key, lang)}</span>
          </Link>
        ))}
      </nav>
      <div style={{ padding:'10px 10px 6px', display:'flex', gap:6 }}>
        <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={() => setLang('en')} style={{ flex:1 }}>EN</button>
        <button className={`lang-btn ${lang==='zh'?'active':''}`} onClick={() => setLang('zh')} style={{ flex:1 }}>中文</button>
      </div>
      <div style={{ height:1, background:'#e0e0e0', margin:'8px 4px' }} />
      <div style={{ padding:'8px 10px', marginBottom:4 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#111', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile.full_name}</div>
        <div style={{ fontSize:10, color:'#e53935', marginTop:2, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{profile.role.replace(/_/g,' ')}</div>
      </div>
      <button onClick={signOut} className="sidebar-link" style={{ color:'#999' }}>
        <span>🚪</span><span>{t('signOut',lang)}</span>
      </button>
    </aside>
  )
}
