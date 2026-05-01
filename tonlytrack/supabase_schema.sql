-- =============================================
-- TONLYTRACK — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('technician','supervisor','senior_supervisor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trucks
CREATE TABLE IF NOT EXISTS trucks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_number TEXT NOT NULL UNIQUE,
  plate TEXT NOT NULL,
  model TEXT NOT NULL,
  vin TEXT,
  mileage INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','in_repair','awaiting_parts','out_of_service')),
  last_service DATE,
  next_service DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Maintenance Tasks
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly','yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','overdue')),
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fault Reports
CREATE TABLE IF NOT EXISTS fault_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID REFERENCES trucks(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Trucks: authenticated users can read; supervisors/admins can modify
CREATE POLICY "trucks_select" ON trucks FOR SELECT TO authenticated USING (true);
CREATE POLICY "trucks_all" ON trucks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','senior_supervisor'))
);

-- Tasks: all can read; technicians can update own assigned tasks; supervisors manage all
CREATE POLICY "tasks_select" ON maintenance_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON maintenance_tasks FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','senior_supervisor'))
);
CREATE POLICY "tasks_update" ON maintenance_tasks FOR UPDATE TO authenticated USING (
  assigned_to = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','senior_supervisor'))
);

-- Fault reports: all can read and insert; supervisors can update
CREATE POLICY "faults_select" ON fault_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "faults_insert" ON fault_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "faults_update" ON fault_reports FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','senior_supervisor'))
);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE fault_reports;
