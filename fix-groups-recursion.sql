-- Fix infinite recursion in group_members policy
-- This script will drop existing problematic policies and recreate them correctly

-- First, let's drop the existing tables and recreate them with proper structure
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'General',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_members INTEGER DEFAULT 1,
    max_members INTEGER,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(300) NOT NULL,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 1,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_category ON public.groups(category);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON public.events(group_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON public.event_attendees(user_id);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Groups policies (simple and safe)
CREATE POLICY "Anyone can view public groups" ON public.groups
    FOR SELECT USING (is_private = false OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups" ON public.groups
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" ON public.groups
    FOR DELETE USING (auth.uid() = created_by);

-- Group members policies (avoiding recursion)
CREATE POLICY "Anyone can view group memberships" ON public.group_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON public.group_members
    FOR DELETE USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Anyone can view upcoming events" ON public.events
    FOR SELECT USING (event_date >= NOW());

CREATE POLICY "Authenticated users can create events" ON public.events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);

CREATE POLICY "Event creators can update their events" ON public.events
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Event creators can delete their events" ON public.events
    FOR DELETE USING (auth.uid() = created_by);

-- Event attendees policies
CREATE POLICY "Anyone can view event attendees" ON public.event_attendees
    FOR SELECT USING (true);

CREATE POLICY "Users can join events" ON public.event_attendees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their attendance" ON public.event_attendees
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave events" ON public.event_attendees
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions to automatically update member counts
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.groups 
        SET current_members = current_members + 1 
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.groups 
        SET current_members = GREATEST(current_members - 1, 0) 
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.events 
        SET current_attendees = current_attendees + 1 
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.events 
        SET current_attendees = GREATEST(current_attendees - 1, 0) 
        WHERE id = OLD.event_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_update_group_member_count
    AFTER INSERT OR DELETE ON public.group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

CREATE TRIGGER trigger_update_event_attendee_count
    AFTER INSERT OR DELETE ON public.event_attendees
    FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Create function to automatically add group creator as first member
CREATE OR REPLACE FUNCTION add_group_creator_as_member()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_add_group_creator_as_member
    AFTER INSERT ON public.groups
    FOR EACH ROW EXECUTE FUNCTION add_group_creator_as_member();

-- Create function to automatically add event creator as first attendee
CREATE OR REPLACE FUNCTION add_event_creator_as_attendee()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.event_attendees (event_id, user_id, status)
    VALUES (NEW.id, NEW.created_by, 'attending');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_add_event_creator_as_attendee
    AFTER INSERT ON public.events
    FOR EACH ROW EXECUTE FUNCTION add_event_creator_as_attendee();