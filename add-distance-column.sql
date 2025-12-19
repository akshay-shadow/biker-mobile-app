-- Add distance_km and coordinate columns to rides table
-- This will store the calculated distance and coordinates for locations

-- Add the distance_km column
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2);

-- Add coordinates columns for better location tracking
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS start_coordinates TEXT;

-- Update existing difficulty constraint to use lowercase values to match our app
ALTER TABLE public.rides 
DROP CONSTRAINT IF EXISTS rides_difficulty_check;

ALTER TABLE public.rides 
ADD CONSTRAINT rides_difficulty_level_check 
CHECK (difficulty IN ('easy', 'moderate', 'hard', 'expert'));

-- Rename difficulty column to match our app code
ALTER TABLE public.rides 
RENAME COLUMN difficulty TO difficulty_level;

-- Rename estimated_duration to match our app code  
ALTER TABLE public.rides 
RENAME COLUMN estimated_duration TO estimated_duration_hours;

-- Change estimated_duration_hours to DECIMAL type to store hours as decimal
ALTER TABLE public.rides 
ALTER COLUMN estimated_duration_hours TYPE DECIMAL(5,2);

-- Update the updated_at column for any existing rides that get their distance calculated
CREATE OR REPLACE FUNCTION calculate_and_update_ride_distance()
RETURNS void AS $$
BEGIN
    -- This function can be used to batch update existing rides with calculated distances
    -- For now, it's just a placeholder for future distance calculations
    RAISE NOTICE 'Distance calculation function ready for use';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to document the new columns
COMMENT ON COLUMN public.rides.distance_km IS 'Calculated distance in kilometers between start_location and end_location';
COMMENT ON COLUMN public.rides.start_coordinates IS 'Coordinates of start location in (longitude,latitude) format';
COMMENT ON COLUMN public.rides.difficulty_level IS 'Difficulty level: easy, moderate, hard, expert';
COMMENT ON COLUMN public.rides.estimated_duration_hours IS 'Estimated ride duration in hours (decimal format)';