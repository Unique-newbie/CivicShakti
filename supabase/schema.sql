-- Run this in your Supabase SQL Editor

-- 1. Create enum for statuses to ensure data integrity
CREATE TYPE complaint_status AS ENUM ('pending', 'reviewed', 'in_progress', 'resolved', 'escalated', 'rejected');

-- 2. Create Complaints Table
CREATE TABLE public.complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_id TEXT UNIQUE NOT NULL, -- e.g., 'C-7B3A9'
    category TEXT NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    address TEXT,
    status complaint_status DEFAULT 'pending',
    image_url TEXT,
    resolution_image_url TEXT,
    citizen_name TEXT,
    citizen_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Status Logs Table (Audit Trail)
CREATE TABLE public.status_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    status_from complaint_status,
    status_to complaint_status NOT NULL,
    remarks TEXT,
    changed_by_staff_id UUID REFERENCES auth.users(id), -- Null if system generated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Automatically generate tracking_id before insert
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tracking_id := 'C-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_tracking_id
BEFORE INSERT ON public.complaints
FOR EACH ROW
WHEN (NEW.tracking_id IS NULL)
EXECUTE FUNCTION generate_tracking_id();

-- 5. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Storage Bucket setup (Optional in SQL, usually GUI)
-- insert into storage.buckets (id, name, public) values ('complaints', 'complaints', true);
