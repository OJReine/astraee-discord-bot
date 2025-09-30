const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Collection, PermissionFlagsBits, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { db } = require('./server/db');
const { users, streams, reactionRoles, roleUsage, moderationLogs, monthlyStats, yearlySummaries, userLevels, scheduledMessages, autoModSettings } = require('./shared/schema');
const { eq, and, gte, lt, desc } = require('drizzle-orm');
const cron = require('node-cron');
const express = require('express');

// Create Express app for UptimeRobot keep-alive
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✦ Astraee is alive and serving with elegance ✦');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Web server running on port ${port}`);
}).on('error', (err) => {
  console.error('Express server error:', err);
});

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Store commands
client.commands = new Collection();

// Astraee's celestial mottos for footers - matching original BotGhost aesthetic
const astraeeMottoes = [
    "Even the stars follow patterns of order.",
    "The stars shine brightest with your care.",
    "Even the stars rest in quiet moments.",
    "The stars align for those who dare to dream.",
    "Grace in action reflects the harmony within.",
    "Patience is the finest art.",
    "Even the stars whisper of time's gentle pull.",
    "Grace awaits your light."
];

const getRandomMotto = () => {
    return astraeeMottoes[Math.floor(Math.random() * astraeeMottoes.length)];
};

// Utility function to create elegant embeds with Astraee's styling
const createAstraeeEmbed = (title, description, color = '#9B59B6') => {
    return new EmbedBuilder()
        .setTitle(`✦ ${title} ✦`)
        .setDescription(description)
        .setColor(color)
        .setFooter({ text: `❖ ${getRandomMotto()} ❖` })
        .setTimestamp();
};

// Generate unique stream ID (10 characters to match original)
const generateStreamId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Create stream created embed - matches original BotGhost design
const createStreamCreatedEmbed = (user, guild, streamId, itemName, shop, dueDate, days, creator) => {
    const dueUnix = Math.floor(dueDate.getTime() / 1000);
    const nowUnix = Math.floor(Date.now() / 1000);
    
    return new EmbedBuilder()
        .setAuthor({ 
            name: user.displayName || user.username, 
            iconURL: user.displayAvatarURL() 
        })
        .setThumbnail(guild.iconURL())
        .setTitle('✦ Stream Tracker Log ✦')
        .setDescription(`A new stream has been registered. Details are below—please follow the workflow until the due date.

**Model:** <@${user.id}>
**Items:** ${itemName}
**Due:** <t:${dueUnix}:D> in ${days} days${creator ? `\n**Creator:** <@${creator.id}>` : ''}
**Stream ID:** ${streamId}`)
        .setColor('#FFB6C1')
        .setFooter({ text: `❖ ${getRandomMotto()} ❖ - Astraee | Created: ${new Date().toLocaleDateString()}` })
        .setTimestamp();
};

// Create stream created DM embed
const createStreamCreatedDMEmbed = (streamId, itemName, dueDate) => {
    const dueUnix = Math.floor(dueDate.getTime() / 1000);
    const nowUnix = Math.floor(Date.now() / 1000);
    
    return new EmbedBuilder()
        .setTitle('✦ Greetings, radiant star! ✦')
        .setDescription(`Your L&B stream has been created. Retain these details for your records and use them with /completestream when complete:

**Stream ID:** ${streamId}
**Items:** ${itemName}
**Due Date:** <t:${dueUnix}:D>

**Next Step:** When your stream is complete, use /completestream stream_id:${streamId} to mark it done.

Keep this ID safe—your brilliance guides the cosmos!`)
        .setColor('#FFB6C1')
        .setFooter({ text: `❖ The stars shine brightest with your care. ❖ - Astraee | Created: ${new Date().toLocaleDateString()}` })
        .setTimestamp();
};

// Create active streams embed with server branding
const createActiveStreamsEmbed = (guild, streamList, totalStreams) => {
    const nowUnix = Math.floor(Date.now() / 1000);
    
    return new EmbedBuilder()
        .setAuthor({ 
            name: guild.name 
        })
        .setThumbnail(guild.iconURL())
        .setTitle('✦ Active Streams Constellation ✦')
        .setDescription(`Behold the current alignments:

${streamList}

Nurture these collaborations with grace.`)
        .setColor('#DDA0DD')
        .setFooter({ text: `❖ The stars align for those who dare to dream. ❖ - Astraee | Total Streams: ${totalStreams}` })
        .setTimestamp();
};

// Create no active streams embed
const createNoActiveStreamsEmbed = () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    
    return new EmbedBuilder()
        .setTitle('✦ Active Streams Overview ✦')
        .setDescription('There are currently no active streams in the constellation. Check back when new collaborations align.')
        .setColor('#DEB887')
        .setFooter({ text: `❖ Even the stars rest in quiet moments. ❖ - Astraee | At: ${new Date().toLocaleDateString()}` })
        .setTimestamp();
};

// Create stream completion embed for channel posting
const createStreamCompletionEmbed = (guild, model, itemName, streamId, dueDate) => {
    const dueUnix = Math.floor(dueDate.getTime() / 1000);
    const nowUnix = Math.floor(Date.now() / 1000);
    
    return new EmbedBuilder()
        .setAuthor({ 
            name: model.displayName || model.username, 
            iconURL: model.displayAvatarURL() 
        })
        .setThumbnail(guild.iconURL())
        .setTitle('✦ Stream Completion Log ✦')
        .setDescription(`A stream has reached its harmonious end. Details below:

**Model:** <@${model.id}>
**Items:** ${itemName}
**Original Due:** <t:${dueUnix}:D>

Well done—your light shines brighter.`)
        .setColor('#98FB98')
        .setFooter({ text: `❖ Grace in action reflects the harmony within. ❖ - Astraee | Stream ID: ${streamId} | Completed: ${new Date().toLocaleDateString()}` })
        .setTimestamp();
};

// Create stream not found embed
const createStreamNotFoundEmbed = () => {
    return new EmbedBuilder()
        .setTitle('✦ Stream Not Found ✦')
        .setDescription('No alignment matches that ID. Verify and try again.')
        .setColor('#F0E68C')
        .setFooter({ text: '❖ Patience is the finest art. ❖ - Astraee' })
        .setTimestamp();
};

// Create stream reminder embed for channels
const createStreamReminderEmbed = (reminderList) => {
    const nowUnix = Math.floor(Date.now() / 1000);
    
    return new EmbedBuilder()
        .setTitle('✦ Stream Reminders: Alignments Approaching ✦')
        .setDescription(`Celestial alert: These streams draw near their zenith. Nurture them before the stars shift.

${reminderList}`)
        .setColor('#F39C12')
        .setFooter({ text: `❖ Even the stars whisper of time's gentle pull. ❖ - Astraee | <t:${nowUnix}:D>` })
        .setTimestamp();
};

// Create stream reminder DM embed
const createStreamReminderDMEmbed = (streamId, itemName, dueDate) => {
    const dueUnix = Math.floor(dueDate.getTime() / 1000);
    
    return new EmbedBuilder()
        .setTitle('✦ Stream Reminder ✦')
        .setDescription(`Radiant one, your stream ${streamId} approaches its due: <t:${dueUnix}:D>. Items: ${itemName}. Complete with /completestream when ready.`)
        .setColor('#F39C12')
        .setFooter({ text: '❖ Grace awaits your light. ❖ - Astraee' })
        .setTimestamp();
};

// Register commands
const commands = [
    // Stream Tracking Commands  
    new SlashCommandBuilder()
        .setName('streamcreate')
        .setDescription('Register a new IMVU stream with ceremonial precision')
        .addStringOption(option => option.setName('items').setDescription('Name of the IMVU items').setRequired(true))
        .addIntegerOption(option => option.setName('days').setDescription('Days until due').setRequired(true)
            .addChoices(
                { name: '1 Day', value: 1 },
                { name: '3 Days', value: 3 },
                { name: '5 Days', value: 5 },
                { name: '7 Days', value: 7 }
            ))
        .addUserOption(option => option.setName('model').setDescription('Model who will be streaming (defaults to you)'))
        .addUserOption(option => option.setName('creator').setDescription('Creator to ping (optional)'))
        .addRoleOption(option => option.setName('role').setDescription('Role to ping for notifications (e.g., @Stream Officers)'))
        .addChannelOption(option => option.setName('channel').setDescription('Channel to post stream log (optional)'))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    new SlashCommandBuilder()
        .setName('activestreams')
        .setDescription('View all active streams with days remaining')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addChannelOption(option => option.setName('channel').setDescription('Channel to send the list to (optional)'))
        .addRoleOption(option => option.setName('role').setDescription('Role to ping (optional)'))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    new SlashCommandBuilder()
        .setName('completestream')
        .setDescription('Mark a stream as complete and archive it')
        .addStringOption(option => option.setName('stream_id').setDescription('Stream ID to complete').setRequired(true))
        .addChannelOption(option => option.setName('channel').setDescription('Channel to post completion log (optional)'))
        .addRoleOption(option => option.setName('role').setDescription('Role to ping for completion notification (e.g., @Stream Officers)'))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    // Additional utility commands
    new SlashCommandBuilder()
        .setName('streaminfo')
        .setDescription('Get detailed information about a specific stream')
        .addStringOption(option => option.setName('stream_id').setDescription('Stream ID to look up').setRequired(true)),

    new SlashCommandBuilder()
        .setName('streamlist')
        .setDescription('List streams with optional filters')
        .addStringOption(option => option.setName('status').setDescription('Filter by status')
            .addChoices(
                { name: 'Active', value: 'active' },
                { name: 'Completed', value: 'completed' },
                { name: 'Overdue', value: 'overdue' }
            ))
        .addUserOption(option => option.setName('model').setDescription('Filter by model'))
        .addChannelOption(option => option.setName('channel').setDescription('Channel to send the list to (optional)')),

    new SlashCommandBuilder()
        .setName('cleanup')
        .setDescription('Clean up old completed streams from database')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option => option.setName('days').setDescription('Delete streams older than X days (default: 7)').setMinValue(1).setMaxValue(30)),

    new SlashCommandBuilder()
        .setName('cleanupall')
        .setDescription('⚠️ Clean up ALL streams from database (use with caution)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addBooleanOption(option => option.setName('confirm').setDescription('Confirm you want to delete ALL streams').setRequired(true)),

    // Utility Commands
    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make Astraee speak with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option => option.setName('message').setDescription('Message to send').setRequired(true))
        .addChannelOption(option => option.setName('channel').setDescription('Channel to send to (defaults to current channel)'))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    // Reaction Role Management
    new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Manage reaction roles with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand => subcommand.setName('add').setDescription('Add reaction role to a message')
            .addStringOption(option => option.setName('message_id').setDescription('Message ID to add reaction role to').setRequired(true))
            .addStringOption(option => option.setName('emoji').setDescription('Emoji to use for reaction').setRequired(true))
            .addRoleOption(option => option.setName('role').setDescription('Role to assign/remove').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('remove').setDescription('Remove reaction role from a message')
            .addStringOption(option => option.setName('message_id').setDescription('Message ID to remove reaction role from').setRequired(true))
            .addStringOption(option => option.setName('emoji').setDescription('Emoji to remove').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('list').setDescription('List all reaction roles for a message')
            .addStringOption(option => option.setName('message_id').setDescription('Message ID to list reaction roles for').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('clear').setDescription('Clear all reaction roles from a message')
            .addStringOption(option => option.setName('message_id').setDescription('Message ID to clear reaction roles from').setRequired(true))),

    // Moderation Commands
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for kick'))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option => option.setName('user').setDescription('User to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for ban'))
        .addIntegerOption(option => option.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option.setName('user').setDescription('User to timeout').setRequired(true))
        .addIntegerOption(option => option.setName('duration').setDescription('Timeout duration in minutes').setRequired(true).setMinValue(1).setMaxValue(40320)) // Max 28 days
        .addStringOption(option => option.setName('reason').setDescription('Reason for timeout'))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user by assigning a mute role')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true))
        .addRoleOption(option => option.setName('mute_role').setDescription('Mute role to assign').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for mute'))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user by removing mute role')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(option => option.setName('user').setDescription('User to unmute').setRequired(true))
        .addRoleOption(option => option.setName('mute_role').setDescription('Mute role to remove'))
        .addStringOption(option => option.setName('reason').setDescription('Reason for unmute'))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription('View moderation logs for a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option => option.setName('user').setDescription('User to view logs for').setRequired(true))
        .addIntegerOption(option => option.setName('limit').setDescription('Number of logs to show (1-25)').setMinValue(1).setMaxValue(25))
        .addBooleanOption(option => option.setName('ephemeral').setDescription('Make response ephemeral (default: false)')),

    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View stream statistics and leaderboards with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('monthly')
                .setDescription('View monthly stream statistics')
                .addIntegerOption(option =>
                    option.setName('year')
                        .setDescription('Year to view (default: current year)')
                        .setMinValue(2020)
                        .setMaxValue(2030))
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Month to view (1-12, default: current month)')
                        .setMinValue(1)
                        .setMaxValue(12)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('yearly')
                .setDescription('View yearly summary and achievements')
                .addIntegerOption(option =>
                    option.setName('year')
                        .setDescription('Year to view (default: current year)')
                        .setMinValue(2020)
                        .setMaxValue(2030)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('submit')
                .setDescription('Submit yearly summary (admin only)')
                .addStringOption(option =>
                    option.setName('summary')
                        .setDescription('Congratulatory summary text')
                        .setRequired(true)
                        .setMaxLength(2000))
                .addIntegerOption(option =>
                    option.setName('year')
                        .setDescription('Year for the summary (default: current year)')
                        .setMinValue(2020)
                        .setMaxValue(2030))
                .addIntegerOption(option =>
                    option.setName('total_streams')
                        .setDescription('Total streams for the year')
                        .setMinValue(0))
                .addStringOption(option =>
                    option.setName('top_performer')
                        .setDescription('Top performing model name')
                        .setMaxLength(100))
                .addNumberOption(option =>
                    option.setName('average_streams')
                        .setDescription('Average streams per model')
                        .setMinValue(0))
                .addStringOption(option =>
                    option.setName('achievements')
                        .setDescription('Special achievements and milestones')
                        .setMaxLength(1000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View stream leaderboard')
                .addStringOption(option =>
                    option.setName('timeframe')
                        .setDescription('Timeframe for leaderboard')
                        .setRequired(true)
                        .addChoices(
                            { name: 'This Month', value: 'month' },
                            { name: 'All Time', value: 'alltime' }
                        ))
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of users to show (default: 10)')
                        .setMinValue(5)
                        .setMaxValue(25))),

    new SlashCommandBuilder()
        .setName('level')
        .setDescription('View and manage user levels with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your or another user\'s level')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to view level for (default: yourself)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('View server level leaderboard')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of users to show (default: 10)')
                        .setMinValue(5)
                        .setMaxValue(25)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('give')
                .setDescription('Give XP to a user (admin only)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to give XP to')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of XP to give')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(10000))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for giving XP')
                        .setMaxLength(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setreward')
                .setDescription('Set level reward roles (admin only)')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Level to set reward for')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to give at this level')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('removereward')
                .setDescription('Remove level reward role (admin only)')
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Level to remove reward for')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rewards')
                .setDescription('View all level reward roles'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset user level data (admin only)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to reset (leave empty for all users)')
                        .setRequired(false))),

    new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Manage scheduled messages and announcements with elegant precision')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new scheduled message')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name for the scheduled message')
                        .setRequired(true)
                        .setMaxLength(100))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Message content to send')
                        .setRequired(true)
                        .setMaxLength(2000))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the message to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('schedule_type')
                        .setDescription('Type of schedule')
                        .setRequired(true)
                        .addChoices(
                            { name: 'One Time', value: 'once' },
                            { name: 'Daily', value: 'daily' },
                            { name: 'Weekly', value: 'weekly' },
                            { name: 'Monthly', value: 'monthly' }
                        ))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Time to send (format: HH:MM, 24-hour)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('date')
                        .setDescription('Date for one-time messages (format: YYYY-MM-DD)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('day_of_week')
                        .setDescription('Day of week for weekly messages (0=Sunday, 1=Monday, etc.)')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Sunday', value: '0' },
                            { name: 'Monday', value: '1' },
                            { name: 'Tuesday', value: '2' },
                            { name: 'Wednesday', value: '3' },
                            { name: 'Thursday', value: '4' },
                            { name: 'Friday', value: '5' },
                            { name: 'Saturday', value: '6' }
                        ))
                .addIntegerOption(option =>
                    option.setName('day_of_month')
                        .setDescription('Day of month for monthly messages (1-31)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addRoleOption(option =>
                    option.setName('ping_role')
                        .setDescription('Role to ping when message is sent')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Whether the schedule is enabled (default: true)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all scheduled messages')
                .addBooleanOption(option =>
                    option.setName('enabled_only')
                        .setDescription('Show only enabled schedules (default: false)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a scheduled message')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the scheduled message to edit')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('New message content')
                        .setMaxLength(2000))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('New channel to send to'))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('New time (format: HH:MM, 24-hour)'))
                .addRoleOption(option =>
                    option.setName('ping_role')
                        .setDescription('New role to ping')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable a scheduled message')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the scheduled message')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable the schedule')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a scheduled message')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the scheduled message to delete')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test a scheduled message immediately')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the scheduled message to test')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View status of all scheduled messages')),

    new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Manage auto-moderation system with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configure auto-moderation settings')
                .addBooleanOption(option =>
                    option.setName('spam_protection')
                        .setDescription('Enable spam protection (default: true)'))
                .addBooleanOption(option =>
                    option.setName('link_filter')
                        .setDescription('Enable link filtering (default: true)'))
                .addIntegerOption(option =>
                    option.setName('mention_limit')
                        .setDescription('Maximum mentions per message (default: 5)')
                        .setMinValue(1)
                        .setMaxValue(20))
                .addBooleanOption(option =>
                    option.setName('bad_words')
                        .setDescription('Enable bad word filtering (default: false)'))
                .addChannelOption(option =>
                    option.setName('log_channel')
                        .setDescription('Channel for auto-moderation logs'))
                .addIntegerOption(option =>
                    option.setName('warning_threshold')
                        .setDescription('Warnings before timeout (default: 3)')
                        .setMinValue(1)
                        .setMaxValue(10))
                .addIntegerOption(option =>
                    option.setName('timeout_duration')
                        .setDescription('Timeout duration in seconds (default: 300)')
                        .setMinValue(60)
                        .setMaxValue(3600)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Enable or disable auto-moderation')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable auto-moderation')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current auto-moderation status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test auto-moderation features')
                .addStringOption(option =>
                    option.setName('test_type')
                        .setDescription('Type of test to run')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Spam Protection', value: 'spam' },
                            { name: 'Link Filter', value: 'links' },
                            { name: 'Mention Limit', value: 'mentions' },
                            { name: 'Bad Words', value: 'badwords' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Manage whitelist for auto-moderation')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add User', value: 'add_user' },
                            { name: 'Remove User', value: 'remove_user' },
                            { name: 'Add Channel', value: 'add_channel' },
                            { name: 'Remove Channel', value: 'remove_channel' },
                            { name: 'List Whitelist', value: 'list' }
                        ))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to whitelist/unwhitelist')
                        .setRequired(false))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to whitelist/unwhitelist')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View auto-moderation statistics'))
];

// Register commands with Discord
client.once('ready', async () => {
    console.log(`✦ Astraee awakens with elegant purpose ✦`);
    console.log(`Logged in as ${client.user.tag}`);
    
    try {
        console.log('Registering slash commands...');
        await client.application?.commands.set(commands);
        console.log('✦ Commands registered with ceremonial precision ✦');
        
        // Scheduled message system will be implemented when needed
        
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// Handle guild member events for welcome/goodbye system
client.on('guildMemberAdd', async member => {
    try {
        // Get welcome settings for this server
        const settings = await db.select().from(null)
            .where(eq(null.serverId, member.guild.id))
            .limit(1);

        if (settings.length === 0 || !settings[0].enabled) {
            console.log(`Welcome system not configured for server ${member.guild.id}`);
            return;
        }

        const welcomeChannel = member.guild.channels.cache.get(settings[0].welcomeChannelId);
        
        if (!welcomeChannel) {
            console.log(`Welcome channel not found for server ${member.guild.id}`);
            return;
        }

        // Send welcome message
        if (settings[0].useRichEmbed) {
            // Create rich embed welcome message
            const embed = new EmbedBuilder()
                .setTitle(settings[0].embedTitle)
                .setColor(settings[0].embedColor || '#9B59B6')
                .setFooter({ text: settings[0].embedFooter || '✦ "Every arrival marks the start of a new chapter." - Astraee ✦' })
                .setTimestamp();

            // Add description with user mention
            if (settings[0].embedDescription) {
                embed.setDescription(settings[0].embedDescription.replace('{user}', member.toString()));
            } else {
                embed.setDescription(`Welcome, ${member}! ✦ We are delighted to have you in **${member.guild.name}**, where creativity meets connection.`);
            }

            // Add thumbnail if set
            if (settings[0].embedThumbnail) {
                let thumbnailUrl = settings[0].embedThumbnail;
                // Handle dynamic placeholders
                if (thumbnailUrl === '{server.icon}') {
                    thumbnailUrl = interaction.guild.iconURL({ dynamic: true, size: 512 });
                } else if (thumbnailUrl === '{user.avatar}') {
                    thumbnailUrl = interaction.user.displayAvatarURL({ dynamic: true, size: 512 });
                }
                if (thumbnailUrl) {
                    embed.setThumbnail(thumbnailUrl);
                }
            }

            // Add image if set
            if (settings[0].embedImage) {
                let imageUrl = settings[0].embedImage;
                // Handle dynamic placeholders
                if (imageUrl === '{server.icon}') {
                    imageUrl = interaction.guild.iconURL({ dynamic: true, size: 512 });
                } else if (imageUrl === '{user.avatar}') {
                    imageUrl = interaction.user.displayAvatarURL({ dynamic: true, size: 512 });
                }
                if (imageUrl) embed.setImage(imageUrl);
            }

            // Add first steps fields if channels are configured
            const fields = [];
            if (settings[0].rulesChannelId) {
                fields.push({
                    name: '📋 Read Our Rules',
                    value: `Visit ${member.guild.channels.cache.get(settings[0].rulesChannelId) || '#rules'} to understand our community standards.`,
                    inline: false
                });
            }
            if (settings[0].startHereChannelId) {
                fields.push({
                    name: '🚀 Get Started',
                    value: `Visit ${member.guild.channels.cache.get(settings[0].startHereChannelId) || '#start-here'} to react and unlock the rest of the server.`,
                    inline: false
                });
            }
            if (settings[0].introChannelId) {
                fields.push({
                    name: '👋 Introduce Yourself',
                    value: `Head to ${member.guild.channels.cache.get(settings[0].introChannelId) || '#introductions'} and start your journey with us.`,
                    inline: false
                });
            }

            if (fields.length > 0) {
                embed.addFields(fields);
            }

            await welcomeChannel.send({ embeds: [embed] });
        } else {
            // Send simple text message
            const welcomeMessage = settings[0].welcomeMessage.replace('{user}', member.toString());
            await welcomeChannel.send(welcomeMessage);
        }

        console.log(`✦ Welcome message sent for ${member.user.username} in ${member.guild.name} ✦`);

    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
});

client.on('guildMemberRemove', async member => {
    try {
        // Get welcome settings for this server
        const settings = await db.select().from(null)
            .where(eq(null.serverId, member.guild.id))
            .limit(1);

        if (settings.length === 0 || !settings[0].enabled) {
            console.log(`Goodbye system not configured for server ${member.guild.id}`);
            return;
        }

        const goodbyeChannel = member.guild.channels.cache.get(settings[0].goodbyeChannelId);
        if (!goodbyeChannel) {
            console.log(`Goodbye channel not found for server ${member.guild.id}`);
            return;
        }

        // Send goodbye message
        const goodbyeMessage = settings[0].goodbyeMessage.replace('{user}', member.user.username);
        await goodbyeChannel.send(goodbyeMessage);

        console.log(`✦ Goodbye message sent for ${member.user.username} in ${member.guild.name} ✦`);

    } catch (error) {
        console.error('Error sending goodbye message:', error);
    }
});

// Handle reaction events for reaction roles
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        // Ignore bot reactions
        if (user.bot) return;

        // Handle partial reactions
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        // Get reaction role from database
        const reactionRole = await db.select().from(reactionRoles)
            .where(and(
                eq(reactionRoles.serverId, reaction.message.guild.id),
                eq(reactionRoles.messageId, reaction.message.id),
                eq(reactionRoles.emoji, reaction.emoji.name || reaction.emoji.toString())
            ))
            .limit(1);

        if (reactionRole.length === 0) return; // No reaction role found

        // Get the role and member
        const role = reaction.message.guild.roles.cache.get(reactionRole[0].roleId);
        const member = reaction.message.guild.members.cache.get(user.id);

        if (!role || !member) return;

        // Check if user already has this role from this message
        const existingUsage = await db.select().from(roleUsage)
            .where(and(
                eq(roleUsage.serverId, reaction.message.guild.id),
                eq(roleUsage.userId, user.id),
                eq(roleUsage.messageId, reaction.message.id),
                eq(roleUsage.roleId, reactionRole[0].roleId)
            ))
            .limit(1);

        if (existingUsage.length > 0) {
            console.log(`✦ User ${user.username} already has role ${role.name} from this message ✦`);
            return; // User already has this role from this message
        }

        // Add the role to the member
        try {
            await member.roles.add(role);
            
            // Track role usage
            await db.insert(roleUsage).values({
                serverId: reaction.message.guild.id,
                userId: user.id,
                roleId: reactionRole[0].roleId,
                messageId: reaction.message.id,
                emoji: reaction.emoji.name || reaction.emoji.toString(),
                action: 'add'
            });
            
            console.log(`✦ Role ${role.name} added to ${user.username} via reaction ✦`);
        } catch (error) {
            console.error('Error adding role:', error);
        }

    } catch (error) {
        console.error('Error handling reaction add:', error);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    try {
        // Ignore bot reactions
        if (user.bot) return;

        // Handle partial reactions
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        // Get reaction role from database
        const reactionRole = await db.select().from(reactionRoles)
            .where(and(
                eq(reactionRoles.serverId, reaction.message.guild.id),
                eq(reactionRoles.messageId, reaction.message.id),
                eq(reactionRoles.emoji, reaction.emoji.name || reaction.emoji.toString())
            ))
            .limit(1);

        if (reactionRole.length === 0) return; // No reaction role found

        // Get the role and member
        const role = reaction.message.guild.roles.cache.get(reactionRole[0].roleId);
        const member = reaction.message.guild.members.cache.get(user.id);

        if (!role || !member) return;

        // Remove the role from the member
        try {
            await member.roles.remove(role);
            
            // Track role usage
            await db.insert(roleUsage).values({
                serverId: reaction.message.guild.id,
                userId: user.id,
                roleId: reactionRole[0].roleId,
                messageId: reaction.message.id,
                emoji: reaction.emoji.name || reaction.emoji.toString(),
                action: 'remove'
            });
            
            console.log(`✦ Role ${role.name} removed from ${user.username} via reaction ✦`);
        } catch (error) {
            console.error('Error removing role:', error);
        }

    } catch (error) {
        console.error('Error handling reaction remove:', error);
    }
});

// Handle message XP for level system
client.on('messageCreate', async message => {
    try {
        // Give XP for messages
        await handleMessageXp(message);
        
        // Handle auto-moderation
        await handleAutoModeration(message);
        
    } catch (error) {
        console.error('Error in messageCreate handler:', error);
    }
});

// Handle button and modal interactions
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
        return;
    }
    
    if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
        return;
    }
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        // Check if this interaction has already been processed
        const interactionId = interaction.id;
        if (interactionTracking.has(interactionId)) {
            console.log(`Interaction ${interactionId} already processed, ignoring duplicate`);
            return;
        }
        
        // Mark this interaction as being processed
        interactionTracking.set(interactionId, Date.now());
        
        // Clean up old interaction tracking (older than 5 minutes)
        const now = Date.now();
        for (const [id, timestamp] of interactionTracking.entries()) {
            if (now - timestamp > 300000) { // 5 minutes
                interactionTracking.delete(id);
            }
        }
        
        console.log(`Processing command: ${commandName} for user ${interaction.user.username}`);
        
        // Stream Commands
        if (commandName === 'streamcreate') {
            await handleStreamCreate(interaction);
        }
        else if (commandName === 'activestreams') {
            await handleActiveStreams(interaction);
        }
        else if (commandName === 'completestream') {
            await handleCompleteStream(interaction);
        }
        else if (commandName === 'streaminfo') {
            await handleStreamInfo(interaction);
        }
        else if (commandName === 'streamlist') {
            await handleStreamList(interaction);
        }
        else if (commandName === 'cleanup') {
            await handleCleanup(interaction);
        }
        else if (commandName === 'cleanupall') {
            await handleCleanupAll(interaction);
        }
        // Utility Commands
        else if (commandName === 'say') {
            await handleSay(interaction);
        }
        // Reaction Role Management
        else if (commandName === 'reactionrole') {
            await handleReactionRole(interaction);
        }
        // Moderation Commands
        else if (commandName === 'kick') {
            await handleKick(interaction);
        }
        else if (commandName === 'ban') {
            await handleBan(interaction);
        }
        else if (commandName === 'timeout') {
            await handleTimeout(interaction);
        }
        else if (commandName === 'mute') {
            await handleMute(interaction);
        }
        else if (commandName === 'unmute') {
            await handleUnmute(interaction);
        }
        else if (commandName === 'modlogs') {
            await handleModLogs(interaction);
        }
        else if (commandName === 'stats') {
            await handleStats(interaction);
        }
        else if (commandName === 'level') {
            await handleLevel(interaction);
        }
        else if (commandName === 'schedule') {
            await handleSchedule(interaction);
        }
        else if (commandName === 'automod') {
            await handleAutoMod(interaction);
        }
        else if (commandName === 'embed') {
            
        }
        else if (commandName === 'settings') {
            await handleSettings(interaction);
        }
    } catch (error) {
        console.error(`Error handling ${commandName}:`, error);
        
        // Only try to reply if the interaction hasn't been acknowledged
        if (!interaction.replied && !interaction.deferred) {
            try {
        const embed = createAstraeeEmbed(
            'Graceful Error',
            'An unexpected disturbance occurred. Please try again with renewed focus.',
            '#E74C3C'
        );
        
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError.message);
            }
        }
    } finally {
        // Clean up interaction tracking
        interactionTracking.delete(interaction.id);
    }
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the bot - require Discord token
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN environment variable is required');
    console.log('Please set your Discord bot token using the secrets manager');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);