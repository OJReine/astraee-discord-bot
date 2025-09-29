const { drizzle } = require('drizzle-orm/neon-serverless');
const { neon } = require('@neondatabase/serverless');
const { sql } = require('drizzle-orm');

// Load environment variables
require('dotenv').config();

async function migrateEmbedSchema() {
    try {
        console.log('Starting embed schema migration...');
        
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is required');
        }

        const sql = neon(connectionString);
        const db = drizzle(sql);

        console.log('Connected to database');

        // Add new columns to embed_templates table
        const alterQueries = [
            // Add author fields
            `ALTER TABLE embed_templates ADD COLUMN IF NOT EXISTS author_name TEXT`,
            `ALTER TABLE embed_templates ADD COLUMN IF NOT EXISTS author_icon TEXT`,
            
            // Add footer fields
            `ALTER TABLE embed_templates ADD COLUMN IF NOT EXISTS footer_text TEXT`,
            `ALTER TABLE embed_templates ADD COLUMN IF NOT EXISTS footer_icon TEXT`,
            `ALTER TABLE embed_templates ADD COLUMN IF NOT EXISTS show_timestamp BOOLEAN DEFAULT true`,
            
            // Add image fields
            `ALTER TABLE embed_templates ADD COLUMN IF NOT EXISTS thumbnail TEXT`,
            `ALTER TABLE embed_templates ADD COLUMN IF NOT EXISTS image TEXT`,
            
            // Rename authorId to createdBy if it exists
            `ALTER TABLE embed_templates RENAME COLUMN author_id TO created_by`,
            
            // Add new columns to welcome_settings table
            `ALTER TABLE welcome_settings ADD COLUMN IF NOT EXISTS welcome_embed_name TEXT`,
            `ALTER TABLE welcome_settings ADD COLUMN IF NOT EXISTS goodbye_embed_name TEXT`,
            `ALTER TABLE welcome_settings ADD COLUMN IF NOT EXISTS goodbye_type TEXT DEFAULT 'leave'`
        ];

        for (const query of alterQueries) {
            try {
                console.log(`Executing: ${query}`);
                await sql(query);
                console.log('✓ Success');
            } catch (error) {
                if (error.message.includes('does not exist') || error.message.includes('already exists')) {
                    console.log('⚠ Skipped (column already exists or does not exist)');
                } else {
                    console.error('✗ Error:', error.message);
                }
            }
        }

        console.log('Embed schema migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateEmbedSchema();
