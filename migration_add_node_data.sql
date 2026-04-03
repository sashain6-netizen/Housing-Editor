-- Migration script to add node_data column to houses table
-- Run this to update existing databases

-- Add the node_data column if it doesn't exist
ALTER TABLE houses ADD COLUMN node_data TEXT DEFAULT '';

-- Update the index to include the new column (optional)
-- The existing indexes should still work fine
