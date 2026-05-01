import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type UserRole = 'technician' | 'supervisor' | 'senior_supervisor'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'
export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type TruckStatus = 'active' | 'in_repair' | 'awaiting_parts' | 'out_of_service'

export interface Profile { id: string; full_name: string; email: string; role: UserRole; created_at: string }
export interface Truck { id: string; truck_number: string; plate: string; model: string; vin: string; mileage: number; status: TruckStatus; last_service: string; next_service: string; created_at: string }
export interface MaintenanceTask {
  id: string; truck_id: string; assigned_to: string | null; title: string; description: string
  frequency: TaskFrequency; status: TaskStatus; due_date: string; completed_at: string | null
  completed_by: string | null; notes: string | null; photo_url: string | null; created_at: string
  truck?: Truck; assignee?: Profile; completer?: Profile
}
export interface FaultReport { id: string; truck_id: string; reported_by: string; description: string; severity: 'low'|'medium'|'high'; resolved: boolean; created_at: string; truck?: Truck }
