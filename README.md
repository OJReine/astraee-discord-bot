# ✦ Astraee - Elegant Discord Bot for IMVU Modeling Agencies ✦

Astraee is a sophisticated Discord bot designed specifically for IMVU modeling agencies and streaming collectives. She embodies elegance, discipline, and accountability while managing stream tracking, automated reminders, moderation, and community features.

## ✦ Features ✦

### Stream Tracking & Management
- `/streamcreate` - Register new IMVU streams with admin/model flexibility
- `/activestreams` - View all active streams with role pinging
- `/completestream` - Mark streams as completed and archive them
- `/streaminfo` - Get detailed information about a specific stream
- `/streamlist` - List streams with optional filters (active/completed/overdue)
- `/cleanup` - Clean up old completed streams (Officer-only)
- `/cleanupall` - Emergency cleanup of all streams (Officer-only)
- Automated reminders 1 day before stream due dates
- 7-day retention for completed streams before automatic cleanup

### Moderation & Community Management
- `/kick` - Kick users with reason logging
- `/ban` - Ban users with message deletion options
- `/timeout` - Timeout users for specified duration
- `/mute` / `/unmute` - Mute/unmute users
- `/modlogs` - View moderation history
- `/reactionrole` - Manage reaction roles for message interactions
- `/say` - Make Astraee speak messages to channels

### Statistics & Leveling System
- `/stats monthly` - View monthly stream statistics
- `/stats yearly` - View yearly stream summaries
- `/stats leaderboard` - Display top performers
- `/stats submit` - Submit yearly summaries (Admin-only)
- `/level view` - Check user level and XP
- `/level leaderboard` - View server level rankings
- `/level give` - Award XP to users (Admin-only)
- `/level setreward` - Set role rewards for levels
- `/level rewards` - View available level rewards

### Automated Systems
- **Auto-Moderation**: Spam protection, link filtering, mention limits, bad word detection
- **Scheduled Messages**: Automated announcements with cron scheduling
- **Level System**: XP tracking from messages with role rewards
- **Statistics Tracking**: Automatic monthly/yearly stream count tracking

### Astraee's Persona
- Elegant, refined, and ceremonial communication style
- Uses ✦ for titles and ❖ for poetic footer mottos
- Celebrates achievements while encouraging accountability
- Formal but never cold tone that embodies "structure as beauty"

## ✦ Quick Start ✦

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Neon/Supabase)
- Discord Bot Token

### Installation
```bash
# Install dependencies
npm install

# Create .env file (copy from env.example)
# Add your DISCORD_TOKEN and DATABASE_URL

# Push database schema
npm run db:push

# Start the bot
npm start
```

### 📖 Detailed Setup Guide
For complete setup instructions, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - it includes:
- Step-by-step Discord bot creation
- Database setup options (Neon, Supabase, local)
- Server configuration
- Troubleshooting guide
- Feature overview

## ✦ Database Schema ✦

The bot uses PostgreSQL with multiple tables for comprehensive functionality:

- **users** - Discord user tracking and roles
- **streams** - IMVU stream records with status tracking
- **reactionRoles** - Reaction role assignments
- **roleUsage** - Track reaction role usage limits
- **moderationLogs** - Moderation action history
- **monthlyStats** - Monthly stream statistics
- **yearlySummaries** - Yearly performance summaries
- **userLevels** - User XP and level tracking
- **scheduledMessages** - Automated message scheduling
- **autoModSettings** - Auto-moderation configuration

## ✦ Commands Reference ✦

### Stream Commands
- **Register Stream**: `/streamcreate items:"Item Name" days:7 model:@ModelUser role:@StreamOfficers`
- **View Active Streams**: `/activestreams` (with optional role pinging)
- **Complete Stream**: `/completestream stream_id:ABC12345 role:@StreamOfficers channel:#stream-tracker`
- **Stream Info**: `/streaminfo stream_id:ABC12345`
- **List Streams**: `/streamlist status:active model:@ModelUser channel:#target-channel`
- **Cleanup**: `/cleanup days:7` (Officers only)
- **Emergency Cleanup**: `/cleanupall confirm:true` (Officers only)

### Moderation Commands
- **Kick User**: `/kick user:@User reason:"Violation of rules"`
- **Ban User**: `/ban user:@User reason:"Severe violation" delete_days:7`
- **Timeout User**: `/timeout user:@User duration:60 reason:"Temporary timeout"`
- **Mute User**: `/mute user:@User reason:"Spam prevention"`
- **Unmute User**: `/unmute user:@User`
- **View Mod Logs**: `/modlogs user:@User`

### Reaction Role Commands
- **Add Reaction Role**: `/reactionrole add message_id:123456789 emoji:🎭 role:@Role`
- **Remove Reaction Role**: `/reactionrole remove message_id:123456789 emoji:🎭`
- **List Reaction Roles**: `/reactionrole list message_id:123456789`
- **Clear All Reaction Roles**: `/reactionrole clear message_id:123456789`

### Statistics Commands
- **Monthly Stats**: `/stats monthly` - View current month's stream statistics
- **Yearly Stats**: `/stats yearly` - View yearly performance summaries
- **Leaderboard**: `/stats leaderboard` - Display top performers
- **Submit Summary**: `/stats submit streams:150 average_streams:12.5` (Admin-only)

### Level System Commands
- **View Level**: `/level view user:@User` - Check user's level and XP
- **Level Leaderboard**: `/level leaderboard` - View server rankings
- **Give XP**: `/level give user:@User amount:100` (Admin-only)
- **Set Reward**: `/level setreward level:10 role:@Role` (Admin-only)
- **Remove Reward**: `/level removereward level:10` (Admin-only)
- **View Rewards**: `/level rewards` - List all level rewards
- **Reset Levels**: `/level reset confirm:true` (Admin-only)

### Utility Commands
- **Say Message**: `/say message:"Hello everyone!" channel:#general`

### Stream Workflow
1. **Admin or Model** uses `/streamcreate` to register stream
2. **Astraee generates** unique Stream ID and logs details
3. **DM sent to model** (not command user) with stream details
4. **Role pinged** in plain text for notifications (if specified)
5. **Creator pinged** in embed (if specified)
6. **Automated reminder** 1 day before due date
7. **Model uses** `/completestream` when finished
8. **Stream archived** and kept for 7 days before automatic cleanup
9. **Officers can use** `/cleanup` to manually clean old streams

## ✦ Customization for Your Server ✦

### Channel Names
The bot looks for these channel patterns:
- `stream-tracker` or `『stream-tracker』` - For stream logs and reminders
- `completed-streams` - For archived completed streams

### Permissions Setup
For officer-only commands:
- Assign "Manage Messages" permission to officer roles for `/activestreams`, `/cleanup`
- Assign "Manage Roles" permission for `/reactionrole` commands
- Assign "Kick Members" permission for `/kick` command
- Assign "Ban Members" permission for `/ban` command
- Or use Discord's slash command permissions in Server Settings

### Admin/Model Flexibility
The bot supports flexible stream creation:
- **Models can create** their own streams (default behavior)
- **Admins can create** streams for models using the `model` parameter
- **DMs are sent** to the model, not the command user
- **Role pinging** for Stream Officers in plain text
- **Creator pinging** in embed for recognition

### Auto-Moderation Configuration
Configure automated moderation features:
- **Spam Protection**: Automatic timeout for repeated messages
- **Link Filtering**: Block or allow links based on server rules
- **Mention Limits**: Prevent mention spam
- **Bad Word Detection**: Filter inappropriate content
- **Whitelist System**: Exempt channels/users from auto-moderation

### Level System Customization
- **XP Rewards**: Set custom XP amounts for different activities
- **Role Rewards**: Assign roles for reaching specific levels
- **Leaderboard Display**: Customize how rankings are shown
- **Level Requirements**: Adjust XP requirements for level progression

### Database Management
- **Automatic cleanup** of completed streams after 7 days
- **Manual cleanup** commands for officers
- **Duplicate prevention** with interaction tracking
- **Efficient storage** to stay within free tier limits
- **Statistics tracking** for performance monitoring

## ✦ Deployment ✦

### For Production Servers
1. Use environment variables for secrets (never commit tokens)
2. Set up proper database backups
3. Monitor bot uptime and logs
4. Consider using PM2 or Docker for process management

### Scaling for Multiple Servers
The bot is designed to work across multiple Discord servers:
- All data is scoped by `serverId`
- Each server maintains independent streams, moderation logs, and statistics
- User data is tracked per server with separate level systems
- Auto-moderation settings are server-specific
- Reaction roles work independently per server

## ✦ Support ✦

### Common Issues
- **Bot not responding**: Check Discord token and bot permissions
- **Database errors**: Verify DATABASE_URL and run `npm run db:push`
- **Command not found**: Ensure bot has "Use Slash Commands" permission

### Bot Philosophy
> "Astraee embodies structure as beauty. She preserves the dignity of streaming, ensuring fairness, recognition, and accountability. Her voice celebrates elegance in order, and order in creativity."

❖ "Order transforms creativity into legacy." ❖