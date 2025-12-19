# How to Fix the Group Members Infinite Recursion Error

## Problem
The error "infinite recursion detected in policy for relation 'group_members'" occurs when Row Level Security (RLS) policies reference themselves or create circular dependencies.

## Solution
Run the SQL script `fix-groups-recursion.sql` in your Supabase SQL Editor to:

1. Drop existing problematic tables and policies
2. Recreate tables with proper structure
3. Set up safe RLS policies that avoid recursion
4. Add automatic triggers for member/attendee counting

## Steps to Fix:

### 1. Open Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to the SQL Editor

### 2. Run the Fix Script
- Copy the contents of `fix-groups-recursion.sql`
- Paste and execute in the SQL Editor

### 3. Verify Tables
The script will create these tables:
- `groups` - For bike groups
- `group_members` - For group memberships  
- `events` - For bike events
- `event_attendees` - For event attendance

### 4. Test Group Creation
- Try creating a group in the app
- The creator will automatically be added as an admin member
- Member count will be automatically maintained

## Key Changes Made:

### RLS Policies (Safe, No Recursion):
- **Groups**: Simple policies based on `created_by` and `is_private` fields
- **Group Members**: Basic policies allowing users to join/leave groups
- **Events**: Policies based on `created_by` and event date
- **Event Attendees**: Simple user-based policies

### Automatic Triggers:
- Group creator automatically becomes admin member
- Event creator automatically becomes attendee
- Member/attendee counts auto-update on join/leave

### Performance Optimizations:
- Proper indexes on frequently queried columns
- Efficient foreign key relationships
- Optimized for common query patterns

This fix eliminates the infinite recursion while maintaining security and functionality.