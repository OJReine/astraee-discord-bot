# ✦ Astraee - Elegant Discord Bot for IMVU Modeling Agencies ✦

Astraee is a sophisticated Discord bot designed specifically for IMVU modeling agencies and streaming collectives. She embodies elegance, discipline, and accountability while managing embed templates, stream tracking, and automated reminders.

## ✦ Features ✦

### Embed Management
- `/embed create` - Create and store reusable embed templates
- `/embed list` - View all stored embed templates
- `/embed edit` - Modify existing embed templates  
- `/embed send` - Send stored embeds to channels

### Stream Tracking
- `/streamcreate` - Register new IMVU streams with automatic ID generation
- `/activestreams` - View all active streams (Officer-only command)
- `/completestream` - Mark streams as completed and archive them
- Automated reminders 1 day before stream due dates

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
- **Register Stream**: `/streamcreate item_name:"Item Name" shop:nina-babes days:7`
- **View Active Streams**: `/activestreams` (Officers only)
- **Complete Stream**: `/completestream stream_id:ABC12345`

### Stream Workflow
1. Model uses `/streamcreate` to register stream
2. Astraee generates unique Stream ID and logs details
3. Bot sends DM confirmation to model
4. Bot tags creator/officer if specified
5. Automated reminder 1 day before due date
6. Model uses `/completestream` when finished
7. Stream archived in completed-streams channel

## ✦ Customization for Your Server ✦

### Channel Names
The bot looks for these channel patterns:
- `stream-tracker` or `『stream-tracker』` - For stream logs and reminders
- `completed-streams` - For archived completed streams

### Permissions Setup
For officer-only commands like `/activestreams`:
- Assign "Manage Messages" permission to officer roles
- Or use Discord's slash command permissions in Server Settings

### Shop Configuration
Current shops supported:
- `nina-babes` (Nina Babes)
- `wildethorn-ladies` (Wildethorn Ladies)

To add new shops, modify the choices in the `/streamcreate` command.

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