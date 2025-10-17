-- Migration: Add chain column to articles table
-- Version: 0004
-- Description: Add a chain column to store blockchain transaction information

-- Add chain column to articles table
ALTER TABLE articles ADD COLUMN content TEXT NOT NULL;

-- Add comment to describe the column
-- The chain column stores blockchain transaction hash or related information
-- Example: '0x1234567890abcdef...' or 'arweave_tx_id_here'
