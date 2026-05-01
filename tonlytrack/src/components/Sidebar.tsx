'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

const navItems = [
  { href:'/dashboard', icon:'📊', label:'Dashboard', roles:['technician','supervisor','senior_supervisor'] },
  { href:'/dashboard/tasks', icon:'✅', label:'Tasks', roles:['technician','supervisor','senior_supervisor'] },
  { href:'/dashboard/trucks', icon:'🚛', label:'Trucks', roles:['supervisor','senior_supervisor'] },
  { href:'/dashboard/faults', icon:'⚠️', label:'Fault Reports', roles:['technician','supervisor','senior_supervisor'] },
  { href:'/dashboard/team', icon:'👥', label:'Team', roles:['supervisor','senior_supervisor'] },
  { href:'/dashboard/reports', icon:'📈', label:'Reports', roles:['supervisor','senior_supervisor'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const links = navItems.filter(n => profile && n.roles.includes(profile.role))

  return (
    <aside style={{ width:220, minHeight:'100vh', background:'#0f0f17', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', padding:'20px 12px', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:28 }}>
        <div style={{ width:32, height:32, background:'linear-gradient(135deg,#f97316,#ea580c)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🚛</div>
        <span style={{ fontFamily:'Bebas Neue', fontSize:20, letterSpacing:2 }}>TONLY<span style={{ color:'#f97316' }}>TRACK</span></span>
      </div>

      <nav style={{ display:'flex', flexDirection:'column', gap:3, flex:1 }}>
        {links.map(item => (
          <Link key={item.href} href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16 }}>
        <div style={{ padding:'10px 14px', marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#e2e2f0' }}>{profile?.full_name}</div>
          <div style={{ fontSize:11, color:'#555570', marginTop:2, textTransform:'capitalize' }}>{profile?.role?.replace('_',' ')}</div>
        </div>
        <button onClick={signOut} className="sidebar-link" style={{ width:'100%', textAlign:'left', background:'none', border:'none' }}>
          <span>🚪</span><span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
