# 🚀 Astraee Discord Bot - Complete Setup Guide

Welcome! This guide will help you set up Astraee, your elegant Discord bot for IMVU modeling agencies, from scratch.

## ✦ What You'll Need ✦

1. **Discord Developer Account** - Free
2. **PostgreSQL Database** - Free options available (Neon, Supabase)
3. **Node.js 18+** - Already installed if you're running this
4. **Basic Terminal/Command Line Knowledge**

## ✦ Step 1: Create Your Discord Bot ✦

### 1.1 Go to Discord Developer Portal
- Visit [https://discord.com/developers/applications](https://discord.com/developers/applications)
- Click **"New Application"**
- Name it "Astraee" (or your preferred name)
- Click **"Create"**

### 1.2 Create the Bot
- In your application, go to the **"Bot"** section
- Click **"Add Bot"**
- Under **"Token"**, click **"Reset Token"**
- Copy the token and save it securely (you'll need this soon)

### 1.3 Configure Bot Permissions
In the Bot section, enable these permissions:
- ✅ **Send Messages**
- ✅ **Use Slash Commands**
- ✅ **Embed Links**
- ✅ **Manage Messages** (for officer commands)
- ✅ **Read Message History**

### 1.4 Invite Bot to Your Server
Use this URL format (replace `YOUR_CLIENT_ID` with your Application ID from General Information):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274878286848&scope=bot%20applications.commands
```

## ✦ Step 2: Set Up Your Database ✦

### Option A: Neon (Recommended - Free Tier Available)
1. Go to [https://neon.tech/](https://neon.tech/)
2. Sign up for free
3. Create a new project
4. Copy the connection string (starts with `postgresql://`)

### Option B: Supabase (Free Tier Available)
1. Go to [https://supabase.com/](https://supabase.com/)
2. Sign up for free
3. Create a new project
4. Go to Settings → Database
5. Copy the connection string

### Option C: Local PostgreSQL
1. Install PostgreSQL on your computer
2. Create a database named `astraee_bot`
3. Connection string format: `postgresql://username:password@localhost:5432/astraee_bot`

## ✦ Step 3: Configure Your Bot ✦

### 3.1 Create Environment File
1. Copy `env.example` to `.env`
2. Edit `.env` with your actual values:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_actual_discord_bot_token_here

# Database Configuration
DATABASE_URL=your_actual_postgresql_connection_string_here

# Optional: Set to 'development' for debug logging
NODE_ENV=production
```

### 3.2 Set Up Database Tables
Run this command to create the necessary database tables:
```bash
npm run db:push
```

You should see output like:
```
✓ Generated SQL
✓ Pushed to database
```

## ✦ Step 4: Start Your Bot ✦

### 4.1 Start the Bot
```bash
npm start
```

You should see:
```
✦ Astraee awakens with elegant purpose ✦
Logged in as Astraee#1234
Registering slash commands...
✦ Commands registered with ceremonial precision ✦
✦ Reminder system initiated with elegant precision ✦
```

### 4.2 Test Commands
In your Discord server, try these commands:
- `/embed create` - Create an embed template
- `/streamcreate` - Register a new stream
- `/activestreams` - View active streams (officer only)

## ✦ Step 5: Configure Your Server ✦

### 5.1 Create Required Channels
The bot looks for these channel patterns:
- `stream-tracker` or `『stream-tracker』` - For stream logs and reminders
- `completed-streams` - For archived completed streams

### 5.2 Set Up Officer Permissions
For officer-only commands like `/activestreams`:
- Assign "Manage Messages" permission to officer roles
- Or use Discord's slash command permissions in Server Settings

### 5.3 Customize Shop Options
Current shops supported:
- `nina-babes` (Nina Babes)
- `wildethorn-ladies` (Wildethorn Ladies)

To add new shops, edit the choices in the `/streamcreate` command in `index.js`.

## ✦ Troubleshooting ✦

### Bot Not Responding
- ✅ Check Discord token is correct
- ✅ Verify bot has proper permissions
- ✅ Ensure bot is online (green status)

### Database Errors
- ✅ Verify DATABASE_URL is correct
- ✅ Run `npm run db:push` to create tables
- ✅ Check database connection

### Commands Not Found
- ✅ Ensure bot has "Use Slash Commands" permission
- ✅ Wait a few minutes for commands to sync
- ✅ Try restarting the bot

### Permission Errors
- ✅ Check bot has "Manage Messages" permission
- ✅ Verify officer roles have proper permissions

## ✦ Bot Features Overview ✦

### Embed Management
- `/embed create` - Create reusable embed templates
- `/embed list` - View all templates
- `/embed edit` - Modify existing templates
- `/embed send` - Send templates to channels

### Stream Tracking
- `/streamcreate` - Register new IMVU streams
- `/activestreams` - View active streams (officers only)
- `/completestream` - Mark streams as complete
- Automated reminders 1 day before due dates

### Astraee's Personality
- Elegant, refined communication style
- Uses ✦ for titles and ❖ for poetic footers
- Celebrates achievements while encouraging accountability
- Formal but never cold tone

## ✦ Scaling for Multiple Servers ✦

The bot is designed to work across multiple Discord servers:
- All data is scoped by server ID
- Each server maintains independent templates and streams
- User data is tracked per server

## ✦ Support ✦

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure database tables were created successfully
4. Check bot permissions in Discord

## ✦ Bot Philosophy ✦

> "Astraee embodies structure as beauty. She preserves the dignity of streaming, ensuring fairness, recognition, and accountability. Her voice celebrates elegance in order, and order in creativity."

❖ "Order transforms creativity into legacy." ❖

---

**Congratulations!** Your Astraee bot is now ready to serve your IMVU modeling agency with elegance and precision. May she bring structure and beauty to your streaming endeavors! ✦

