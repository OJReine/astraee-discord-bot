// Database setup script for external databases
// Run this once after connecting your external database

const { Pool } = require('pg');

// Your database connection string
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function setupDatabase() {
    try {
        console.log('🔧 Setting up database tables...');
        
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                discord_id TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL,
                roles JSONB DEFAULT '[]',
                server_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `);
        console.log('✅ Users table created');

        // Create embed_templates table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS embed_templates (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                title TEXT,
                description TEXT,
                color TEXT DEFAULT '#9B59B6',
                footer TEXT,
                fields JSONB DEFAULT '[]',
                author_id TEXT NOT NULL,
                server_id TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
                UNIQUE(name, server_id)
            )
        `);
        console.log('✅ Embed templates table created');

        // Create streams table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                stream_id TEXT NOT NULL UNIQUE,
                model_id TEXT NOT NULL,
                creator_id TEXT,
                item_name TEXT NOT NULL,
                item_link TEXT,
                due_date TIMESTAMP NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                shop TEXT NOT NULL,
                server_id TEXT NOT NULL,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            )
        `);
        console.log('✅ Streams table created');

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
            CREATE INDEX IF NOT EXISTS idx_users_server_id ON users(server_id);
            CREATE INDEX IF NOT EXISTS idx_embed_templates_server_id ON embed_templates(server_id);
            CREATE INDEX IF NOT EXISTS idx_streams_server_id ON streams(server_id);
            CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
            CREATE INDEX IF NOT EXISTS idx_streams_due_date ON streams(due_date);
        `);
        console.log('✅ Database indexes created');

        console.log('🎉 Database setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupDatabase();
