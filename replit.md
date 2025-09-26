# ✦ Astraee Discord Bot Project ✦

## Project Overview
This is a sophisticated Discord bot named "Astraee" built for IMVU modeling agencies and streaming collectives. The bot manages embed templates, tracks IMVU streams, and provides automated reminders with an elegant, ceremonial persona.

## Recent Changes (September 26, 2025)
- ✅ Built complete Discord bot from scratch using discord.js v14
- ✅ Implemented PostgreSQL database with Drizzle ORM
- ✅ Created elegant Astraee persona with poetic footers and ceremonial language
- ✅ Built embed management system (/embed create, list, edit, send)
- ✅ Built stream tracking system (/streamcreate, /activestreams, /completestream)
- ✅ Implemented automated reminder system using node-cron
- ✅ Added proper role-based permissions for officer commands
- ✅ Created deployment configuration and setup documentation

## User Preferences
- **Project Goal**: Replace previous BotGhost no-code bot with custom coded solution
- **Target Users**: IMVU modeling agencies (Ladies & Babes collective and others)
- **Tone**: Elegant, refined, ceremonial - "structure as beauty"
- **Scalability**: Designed to work for multiple IMVU modeling agency servers

## Project Architecture

### Core Components
- **index.js** - Main Discord bot application with slash commands
- **shared/schema.js** - Database schema with users, embed_templates, and streams tables
- **server/db.js** - Database connection and configuration
- **package.json** - Dependencies and scripts
- **drizzle.config.ts** - Database migration configuration

### Database Schema
- **users** - Discord user tracking per server
- **embed_templates** - Reusable embed templates with server scoping
- **streams** - IMVU stream records with status tracking and due dates

### Key Features
- **Elegant Persona**: Uses ✦ for titles, ❖ for footer mottos, minimal emojis
- **Stream Management**: Generates unique Stream IDs, tracks due dates, automated reminders
- **Multi-Server Support**: All data scoped by serverId for multiple agencies
- **Role Permissions**: Officer-only commands using Discord permissions

## Environment Setup
- **DISCORD_TOKEN** - Bot authentication token (configured in secrets)
- **DATABASE_URL** - PostgreSQL connection string (auto-configured)
- **Workflow**: "Astraee Bot" runs `npm start` on console output

## Deployment Status
- ✅ Bot successfully running and connected to Discord
- ✅ Database schema pushed and operational  
- ✅ All slash commands registered and functional
- ✅ Reminder system active with daily cron job
- ✅ Ready for use by IMVU modeling agencies

## Next Steps for Users
1. Invite bot to their Discord server with proper permissions
2. Set up channels: `stream-tracker`, `completed-streams`
3. Configure officer roles for `/activestreams` command
4. Customize shop choices if needed for their specific IMVU shops
5. Test embed templates and stream workflow

## Bot Philosophy
*"Astraee embodies structure as beauty. She preserves the dignity of streaming, ensuring fairness, recognition, and accountability. Her voice celebrates elegance in order, and order in creativity."*

❖ "Order transforms creativity into legacy." ❖