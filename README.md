# ✦ Astraee - Elegant Discord Bot for IMVU Modeling Agencies ✦

Astraee is a sophisticated Discord bot designed specifically for IMVU modeling agencies and streaming collectives. She embodies elegance, discipline, and accountability while managing embed templates, stream tracking, and automated reminders.

## ✦ Features ✦

### Embed Management
- `/embed create` - Create and store reusable embed templates
- `/embed list` - View all stored embed templates
- `/embed edit` - Modify existing embed templates  
- `/embed send` - Send stored embeds to channels

### Stream Tracking
- `/streamcreate` - Register new IMVU streams with admin/model flexibility
- `/activestreams` - View all active streams with role pinging
- `/completestream` - Mark streams as completed and archive them
- `/streaminfo` - Get detailed information about a specific stream
- `/streamlist` - List streams with optional filters (active/completed/overdue)
- `/cleanup` - Clean up old completed streams (Officer-only)
- `/cleanupall` - Emergency cleanup of all streams (Officer-only)
- Automated reminders 1 day before stream due dates
- 7-day retention for completed streams before automatic cleanup

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

The bot uses PostgreSQL with three main tables:

- **users** - Discord user tracking and roles
- **embed_templates** - Stored embed templates by server
- **streams** - IMVU stream records with status tracking

## ✦ Commands Reference ✦

### Embed Commands
- **Create Template**: `/embed create name:template-name title:"Optional Title" description:"Template content"`
- **List Templates**: `/embed list`
- **Edit Template**: `/embed edit name:existing-template title:"New Title"`
- **Send Template**: `/embed send name:template-name channel:#target-channel`

### Stream Commands
- **Register Stream**: `/streamcreate items:"Item Name" days:7 model:@ModelUser role:@StreamOfficers`
- **View Active Streams**: `/activestreams` (with optional role pinging)
- **Complete Stream**: `/completestream stream_id:ABC12345 role:@StreamOfficers channel:#stream-tracker`
- **Stream Info**: `/streaminfo stream_id:ABC12345`
- **List Streams**: `/streamlist status:active model:@ModelUser channel:#target-channel`
- **Cleanup**: `/cleanup days:7` (Officers only)
- **Emergency Cleanup**: `/cleanupall confirm:true` (Officers only)

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
For officer-only commands like `/activestreams`:
- Assign "Manage Messages" permission to officer roles
- Or use Discord's slash command permissions in Server Settings

### Admin/Model Flexibility
The bot supports flexible stream creation:
- **Models can create** their own streams (default behavior)
- **Admins can create** streams for models using the `model` parameter
- **DMs are sent** to the model, not the command user
- **Role pinging** for Stream Officers in plain text
- **Creator pinging** in embed for recognition

### Database Management
- **Automatic cleanup** of completed streams after 7 days
- **Manual cleanup** commands for officers
- **Duplicate prevention** with interaction tracking
- **Efficient storage** to stay within free tier limits

## ✦ Deployment ✦

### For Production Servers
1. Use environment variables for secrets (never commit tokens)
2. Set up proper database backups
3. Monitor bot uptime and logs
4. Consider using PM2 or Docker for process management

### Scaling for Multiple Servers
The bot is designed to work across multiple Discord servers:
- All data is scoped by `serverId`
- Each server maintains independent embed templates and streams
- User data is tracked per server

## ✦ Support ✦

### Common Issues
- **Bot not responding**: Check Discord token and bot permissions
- **Database errors**: Verify DATABASE_URL and run `npm run db:push`
- **Command not found**: Ensure bot has "Use Slash Commands" permission

### Bot Philosophy
> "Astraee embodies structure as beauty. She preserves the dignity of streaming, ensuring fairness, recognition, and accountability. Her voice celebrates elegance in order, and order in creativity."

❖ "Order transforms creativity into legacy." ❖