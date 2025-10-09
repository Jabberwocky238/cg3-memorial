-- Migration: Add tags column to articles table
-- Version: 0003
-- Description: Add a tags column to store article tags as JSON

-- Add tags column to articles table
ALTER TABLE articles ADD COLUMN tags TEXT DEFAULT '{}';

-- Add comment to describe the column
-- The tags column stores article tags as JSON string
-- Example: '{"topic": ["react", "typescript"], "date": ["2024-01-01"]}'
