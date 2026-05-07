'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => { if (!loading && !user) router.push('/') }, [user, loading])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #ffebee', borderTop:'3px solid #e53935', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color:'#888', fontSize:13 }}>Loading TonlyTrack...</div>
      </div>
    </div>
  )

  if (!user) return null

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f5' }}>
      <Sidebar />
      <main style={{ flex:1, overflow:'auto', background:'#f5f5f5' }}>
        {children}
      </main>
    </div>
  )
}
