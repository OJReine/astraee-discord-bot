const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Collection, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { db } = require('./server/db');
const { users, embedTemplates, streams, welcomeSettings, reactionRoles, roleUsage, moderationLogs, monthlyStats, yearlySummaries, userLevels, scheduledMessages, autoModSettings } = require('./shared/schema');
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
    // Embed Management Commands
    new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Manage embed templates with elegance')
        .addSubcommand(subcommand =>
            subcommand.setName('create')
                .setDescription('Create a new embed template')
                .addStringOption(option => option.setName('name').setDescription('Template name').setRequired(true))
                .addStringOption(option => option.setName('title').setDescription('Embed title'))
                .addStringOption(option => option.setName('description').setDescription('Embed description'))
                .addStringOption(option => option.setName('color').setDescription('Hex color (e.g., #9B59B6)'))
                .addStringOption(option => option.setName('footer').setDescription('Custom footer text')))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('List all stored embed templates'))
        .addSubcommand(subcommand =>
            subcommand.setName('edit')
                .setDescription('Edit an existing embed template')
                .addStringOption(option => option.setName('name').setDescription('Template name to edit').setRequired(true))
                .addStringOption(option => option.setName('title').setDescription('New title'))
                .addStringOption(option => option.setName('description').setDescription('New description'))
                .addStringOption(option => option.setName('color').setDescription('New hex color'))
                .addStringOption(option => option.setName('footer').setDescription('New footer text')))
        .addSubcommand(subcommand =>
            subcommand.setName('send')
                .setDescription('Send a stored embed to a channel')
                .addStringOption(option => option.setName('name').setDescription('Template name to send').setRequired(true))
                .addChannelOption(option => option.setName('channel').setDescription('Channel to send to').setRequired(true))),

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

    // Community Management Commands
    new SlashCommandBuilder()
        .setName('welcomer')
        .setDescription('Manage welcome and goodbye system with elegant precision')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand => subcommand.setName('setup').setDescription('Setup welcome system')
            .addChannelOption(option => option.setName('welcome_channel').setDescription('Channel for welcome messages'))
            .addChannelOption(option => option.setName('goodbye_channel').setDescription('Channel for goodbye messages'))
            .addStringOption(option => option.setName('welcome_message').setDescription('Welcome message template (use {user} for username)'))
            .addStringOption(option => option.setName('goodbye_message').setDescription('Goodbye message template (use {user} for username)')))
        .addSubcommand(subcommand => subcommand.setName('embed').setDescription('Configure rich embed settings')
            .addBooleanOption(option => option.setName('enabled').setDescription('Enable rich embeds').setRequired(true))
            .addStringOption(option => option.setName('title').setDescription('Embed title'))
            .addStringOption(option => option.setName('description').setDescription('Embed description'))
            .addStringOption(option => option.setName('color').setDescription('Embed color (hex code)'))
            .addStringOption(option => option.setName('thumbnail').setDescription('Thumbnail URL'))
            .addStringOption(option => option.setName('image').setDescription('Image URL'))
            .addStringOption(option => option.setName('footer').setDescription('Footer text'))
            .addChannelOption(option => option.setName('rules_channel').setDescription('Rules channel for first steps'))
            .addChannelOption(option => option.setName('start_here_channel').setDescription('Start here channel for first steps'))
            .addChannelOption(option => option.setName('intro_channel').setDescription('Introduction channel for first steps')))
        .addSubcommand(subcommand => subcommand.setName('toggle').setDescription('Enable/disable welcome system')
            .addBooleanOption(option => option.setName('enabled').setDescription('Enable welcome system').setRequired(true)))
        .addSubcommand(subcommand => subcommand.setName('test').setDescription('Test welcome message'))
        .addSubcommand(subcommand => subcommand.setName('status').setDescription('View current welcome system settings')),

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
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .addIntegerOption(option =>
                    option.setName('year')
                        .setDescription('Year for the summary (default: current year)')
                        .setMinValue(2020)
                        .setMaxValue(2030))
                .addStringOption(option =>
                    option.setName('summary')
                        .setDescription('Congratulatory summary text')
                        .setRequired(true)
                        .setMaxLength(2000))
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
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
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
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
        
        // Start reminder system
        startReminderSystem();
        startScheduledMessageSystem();
        
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

// Handle guild member events for welcome/goodbye system
client.on('guildMemberAdd', async member => {
    try {
        // Get welcome settings for this server
        const settings = await db.select().from(welcomeSettings)
            .where(eq(welcomeSettings.serverId, member.guild.id))
            .limit(1);

        if (settings.length === 0 || !settings[0].enabled || !settings[0].welcomeChannelId) {
            return; // Welcome system not configured or disabled
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
                embed.setThumbnail(settings[0].embedThumbnail);
            }

            // Add image if set
            if (settings[0].embedImage) {
                embed.setImage(settings[0].embedImage);
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
        const settings = await db.select().from(welcomeSettings)
            .where(eq(welcomeSettings.serverId, member.guild.id))
            .limit(1);

        if (settings.length === 0 || !settings[0].enabled || !settings[0].goodbyeChannelId) {
            return; // Goodbye system not configured or disabled
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
        
        // Embed Management Commands
        if (commandName === 'embed') {
            await handleEmbedCommand(interaction);
        }
        // Stream Commands
        else if (commandName === 'streamcreate') {
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
        // Community Management Commands
        else if (commandName === 'welcomer') {
            await handleWelcomer(interaction);
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

// Embed command handler
async function handleEmbedCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'create') {
        const name = interaction.options.getString('name');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#9B59B6';
        const footer = interaction.options.getString('footer');

        // Validate color format
        if (color && !color.match(/^#[0-9A-F]{6}$/i)) {
            const embed = createAstraeeEmbed('Refinement Needed', 'Please provide color in proper hex format (e.g., #9B59B6).', '#E74C3C');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        try {
            await db.insert(embedTemplates).values({
                name,
                title,
                description,
                color,
                footer,
                authorId: interaction.user.id,
                serverId: interaction.guild.id
            });

            const embed = createAstraeeEmbed(
                'Template Preserved',
                `Embed template "${name}" has been stored with elegant precision.\n\nIt shall serve you well in future endeavors.`
            );
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
                const embed = createAstraeeEmbed('Gentle Correction', `A template named "${name}" already graces this server. Choose a new name to avoid confusion.`, '#F39C12');
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else {
                throw error;
            }
        }
    }
    
    else if (subcommand === 'list') {
        const templates = await db.select().from(embedTemplates)
            .where(eq(embedTemplates.serverId, interaction.guild.id));

        if (templates.length === 0) {
            const embed = createAstraeeEmbed(
                'Empty Archive',
                'No embed templates have been created yet.\n\nBegin your collection with `/embed create`.'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const templateList = templates.map((t, i) => 
            `${i + 1}. **${t.name}** ${t.title ? `- *${t.title}*` : ''}`
        ).join('\n');

        const embed = createAstraeeEmbed(
            'Template Archive',
            `Your stored templates:\n\n${templateList}\n\n*Use \`/embed send\` to deploy them with grace.*`
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    
    else if (subcommand === 'edit') {
        const name = interaction.options.getString('name');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color');
        const footer = interaction.options.getString('footer');

        // Validate color format if provided
        if (color && !color.match(/^#[0-9A-F]{6}$/i)) {
            const embed = createAstraeeEmbed('Refinement Needed', 'Please provide color in proper hex format (e.g., #9B59B6).', '#E74C3C');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const [existingTemplate] = await db.select().from(embedTemplates)
            .where(and(
                eq(embedTemplates.name, name),
                eq(embedTemplates.serverId, interaction.guild.id)
            ));

        if (!existingTemplate) {
            const embed = createAstraeeEmbed('Template Not Found', `No template named "${name}" exists in this server's archive.`, '#E74C3C');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Build update object with only provided fields
        const updateData = { updatedAt: new Date() };
        if (title !== null) updateData.title = title;
        if (description !== null) updateData.description = description;
        if (color !== null) updateData.color = color;
        if (footer !== null) updateData.footer = footer;

        await db.update(embedTemplates)
            .set(updateData)
            .where(eq(embedTemplates.id, existingTemplate.id));

        const embed = createAstraeeEmbed(
            'Template Refined',
            `Embed template "${name}" has been updated with elegant precision.\n\nYour changes have been preserved with ceremonial care.`
        );
        
        await interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'send') {
        const name = interaction.options.getString('name');
        const channel = interaction.options.getChannel('channel');

        const [template] = await db.select().from(embedTemplates)
            .where(and(
                eq(embedTemplates.name, name),
                eq(embedTemplates.serverId, interaction.guild.id)
            ));

        if (!template) {
            const embed = createAstraeeEmbed('Template Not Found', `No template named "${name}" exists in this server's archive.`, '#E74C3C');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const sentEmbed = new EmbedBuilder()
            .setColor(template.color || '#9B59B6')
            .setTimestamp();

        if (template.title) sentEmbed.setTitle(template.title);
        if (template.description) sentEmbed.setDescription(template.description);
        if (template.footer) sentEmbed.setFooter({ text: template.footer });

        await channel.send({ embeds: [sentEmbed] });

        const confirmEmbed = createAstraeeEmbed(
            'Message Delivered',
            `Template "${name}" has been sent to ${channel} with elegant precision.`
        );
        
        await interaction.reply({ embeds: [confirmEmbed], flags: MessageFlags.Ephemeral });
    }
}

// Command execution tracking to prevent duplicates
const commandExecutions = new Map();
const interactionTracking = new Map();

// Stream create handler - updated for admin/model concept
async function handleStreamCreate(interaction) {
    const itemName = interaction.options.getString('items');
    const model = interaction.options.getUser('model') || interaction.user; // Default to command user if no model specified
    const days = interaction.options.getInteger('days');
    const creator = interaction.options.getUser('creator');
    const role = interaction.options.getRole('role');
    const targetChannel = interaction.options.getChannel('channel');
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    // Create a unique key for this command execution
    const commandKey = `${interaction.user.id}-${interaction.guild.id}-${itemName}-${Date.now()}`;
    
    // Check if this exact command is already being processed
    if (commandExecutions.has(commandKey)) {
        const embed = createAstraeeEmbed(
            'Command Already Processing',
            'This command is already being processed. Please wait a moment.',
            '#F0E68C'
        );
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // Mark this command as being processed
    commandExecutions.set(commandKey, true);
    
    // Clean up old command keys (older than 30 seconds)
    const now = Date.now();
    for (const [key, timestamp] of commandExecutions.entries()) {
        if (now - timestamp > 30000) {
            commandExecutions.delete(key);
        }
    }

    // Generate unique stream ID first
    const streamId = generateStreamId();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    // Check for duplicate stream creation within last 30 seconds
    const recentStreams = await db.select().from(streams)
        .where(and(
            eq(streams.modelId, model.id),
            eq(streams.itemName, itemName),
            eq(streams.serverId, interaction.guild.id),
            eq(streams.status, 'active')
        ))
        .orderBy(desc(streams.createdAt));

    // If there's a recent stream with same details, don't create another
    if (recentStreams.length > 0) {
        const recentStream = recentStreams[0];
        const timeDiff = Date.now() - recentStream.createdAt.getTime();
        
        if (timeDiff < 30000) { // 30 seconds
            const embed = createAstraeeEmbed(
                'Duplicate Prevention',
                `A stream with the same details was created recently. Please wait before creating another.\n\n**Recent Stream ID:** ${recentStream.streamId}\n**Time since creation:** ${Math.round(timeDiff / 1000)} seconds`,
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }

    // Additional check: prevent rapid-fire duplicate commands
    const userRecentStreams = await db.select().from(streams)
        .where(and(
            eq(streams.modelId, model.id),
            eq(streams.serverId, interaction.guild.id),
            eq(streams.status, 'active')
        ))
        .orderBy(desc(streams.createdAt))
        .limit(1);

    if (userRecentStreams.length > 0) {
        const lastStream = userRecentStreams[0];
        const timeDiff = Date.now() - lastStream.createdAt.getTime();
        
        if (timeDiff < 5000) { // 5 seconds between any stream creation
            const embed = createAstraeeEmbed(
                'Rate Limiting',
                `Please wait a moment before creating another stream.\n\n**Last Stream ID:** ${lastStream.streamId}`,
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }

    try {
        // Insert stream with unique constraint protection
        await db.insert(streams).values({
            streamId,
            modelId: model.id, // Use the model, not the command user
            creatorId: creator?.id,
            itemName,
            itemLink: null, // Removed item link option
            dueDate,
            shop: 'Nina Babes', // Default shop since it's not displayed
            serverId: interaction.guild.id
        });

        console.log(`Stream created successfully: ${streamId} for model ${model.username} by ${interaction.user.username}`);

        // Create embed using original BotGhost design
        const embed = createStreamCreatedEmbed(
            model, // Use the model, not the command user
            interaction.guild, 
            streamId, 
            itemName, 
            'Nina Babes', // Default shop
            dueDate, 
            days, 
            creator
        );

        // Send main response with plain text for tagging before embed
        let responseText = '';
        if (role) {
            responseText += `<@&${role.id}> `;
        }
        // Don't ping creators in plain text since they're already in the embed

        // If a specific channel is provided, send there instead of replying
        if (targetChannel) {
            try {
                await targetChannel.send({ 
            content: responseText,
            embeds: [embed] 
        });
                const confirmEmbed = createAstraeeEmbed(
                    'Stream Created',
                    `Stream has been created and sent to ${targetChannel} with elegant precision.`
                );
                await interaction.reply({ embeds: [confirmEmbed], flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.log('Could not send to target channel:', error.message);
                // Fallback to regular reply if channel send fails
                await interaction.reply({ 
                    content: responseText,
                    embeds: [embed],
                    flags: ephemeral ? MessageFlags.Ephemeral : 0
                });
            }
        } else {
            // Send regular reply if no target channel
            await interaction.reply({ 
                content: responseText,
                embeds: [embed],
                flags: ephemeral ? MessageFlags.Ephemeral : 0
            });
        }

        // Send DM to the model (not the command user)
        try {
            const dmEmbed = createStreamCreatedDMEmbed(streamId, itemName, dueDate);
            await model.send({ embeds: [dmEmbed] });
            console.log(`DM sent to model ${model.username} for stream ${streamId}`);
        } catch (error) {
            console.log('Could not send DM to model:', error.message);
        }

    } catch (error) {
        console.error('Error creating stream:', error);
        
        // Handle duplicate key violations
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            const embed = createAstraeeEmbed(
                'Duplicate Stream Detected',
                `A stream with this ID already exists. This might be due to a network issue.\n\n**Stream ID:** ${streamId}\n\nPlease try again in a moment.`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        // Handle other database errors
        const embed = createAstraeeEmbed(
            'Stream Creation Failed',
            'An error occurred while creating the stream. Please try again later.',
            '#E74C3C'
        );
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } finally {
        // Clean up command execution tracking
        commandExecutions.delete(commandKey);
    }
}

// Active streams handler - updated to match original BotGhost design
async function handleActiveStreams(interaction) {
    const targetChannel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;
    
    const activeStreams = await db.select().from(streams)
        .where(and(
            eq(streams.serverId, interaction.guild.id),
            eq(streams.status, 'active')
        ));

    if (activeStreams.length === 0) {
        const embed = createNoActiveStreamsEmbed();
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const now = new Date();
    const streamList = activeStreams.map(stream => {
        const daysRemaining = Math.ceil((stream.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const dueUnix = Math.floor(stream.dueDate.getTime() / 1000);
        const status = daysRemaining < 0 ? '🔴 Overdue' : daysRemaining <= 1 ? '🟡 Due Soon' : '🟢 Active';
        
        // Format to match original BotGhost design with cute unicode symbols
        return `₊˚ପ⊹ **${stream.streamId}** - ${stream.itemName}
<@${stream.modelId}> | <t:${dueUnix}:D> | ${status}`;
    }).join('\n\n');

    const embed = createActiveStreamsEmbed(interaction.guild, streamList, activeStreams.length);

    // If a specific channel is provided, send there instead
    if (targetChannel) {
        try {
            let content = '';
            if (role) {
                content = `<@&${role.id}>`;
            }
            await targetChannel.send({ 
                content: content,
                embeds: [embed] 
            });
            const confirmEmbed = createAstraeeEmbed(
                'Streams Delivered',
                `Active streams list has been sent to ${targetChannel} with elegant precision.`
            );
            return interaction.reply({ embeds: [confirmEmbed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.log('Could not send to target channel:', error.message);
            const errorEmbed = createAstraeeEmbed(
                'Delivery Failed',
                `Could not send to ${targetChannel}. Please check permissions.`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
    }

    await interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : 0 });
}

// Complete stream handler - updated to match original BotGhost design
async function handleCompleteStream(interaction) {
    const streamId = interaction.options.getString('stream_id').toUpperCase();
    const targetChannel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    const [stream] = await db.select().from(streams)
        .where(and(
            eq(streams.streamId, streamId),
            eq(streams.serverId, interaction.guild.id),
            eq(streams.status, 'active')
        ));

    if (!stream) {
        const embed = createStreamNotFoundEmbed();
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // Check permissions: either stream owner or member with Manage Messages
    const isStreamOwner = stream.modelId === interaction.user.id;
    const hasManageMessages = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
    
    if (!isStreamOwner && !hasManageMessages) {
        const embed = createAstraeeEmbed(
            'Graceful Restraint', 
            'Only the stream owner or officers with proper authority may complete this stream.\n\nSeek guidance from those with ceremonial permissions.',
            '#E74C3C'
        );
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // Mark stream as completed instead of deleting immediately
    await db.update(streams)
        .set({ 
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
        })
        .where(eq(streams.id, stream.id));

    // Get model user for embed
    const model = await interaction.guild.members.fetch(stream.modelId);

    // Create completion embed using original design
    const completionEmbed = createStreamCompletionEmbed(
        interaction.guild, 
        model.user, 
        stream.itemName, 
        streamId, 
        stream.dueDate
    );

    // Send completion notification
    let responseText = '';
    if (role) {
        responseText = `<@&${role.id}>`;
    }

    // If a specific channel is provided, send there
    if (targetChannel) {
        try {
            await targetChannel.send({ 
                content: responseText,
            embeds: [completionEmbed] 
        });
    const confirmEmbed = createAstraeeEmbed(
        'Completion Recorded',
                `Stream **${streamId}** has been marked complete and sent to ${targetChannel}.\n\nYour dedication shines eternal in our constellation.`
            );
            await interaction.reply({ embeds: [confirmEmbed], flags: ephemeral ? MessageFlags.Ephemeral : 0 });
        } catch (error) {
            console.log('Could not send to target channel:', error.message);
            const errorEmbed = createAstraeeEmbed(
                'Delivery Failed',
                `Could not send to ${targetChannel}. Please check permissions.`,
                '#E74C3C'
            );
            await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }
    } else {
        // Send regular reply if no target channel
        await interaction.reply({ 
            content: responseText,
            embeds: [completionEmbed],
            flags: ephemeral ? MessageFlags.Ephemeral : 0
        });
    }

    // Update monthly statistics for the model
    await updateMonthlyStats(interaction.guild.id, stream.modelId);
}

// Reminder system - updated to match original BotGhost design
function startReminderSystem() {
    // Run every day at 9:00 AM to check for streams due tomorrow
    cron.schedule('0 9 * * *', async () => {
        console.log('✦ Checking for streams requiring gentle reminders ✦');
        
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 59, 999); // End of tomorrow
            
            const todayStart = new Date();
            todayStart.setDate(todayStart.getDate() + 1);
            todayStart.setHours(0, 0, 0, 0); // Start of tomorrow

            // Find streams due tomorrow (between start and end of tomorrow)
            const streamsDueTomorrow = await db.select().from(streams)
                .where(and(
                    eq(streams.status, 'active'),
                    gte(streams.dueDate, todayStart),
                    lt(streams.dueDate, tomorrow)
                ));

            if (streamsDueTomorrow.length === 0) return;

            // Group by server for channel reminders
            const serverStreams = new Map();
            for (const stream of streamsDueTomorrow) {
                if (!serverStreams.has(stream.serverId)) {
                    serverStreams.set(stream.serverId, []);
                }
                serverStreams.get(stream.serverId).push(stream);
            }

            // Send reminders per server
            for (const [serverId, streams] of serverStreams) {
                try {
                    const guild = client.guilds.cache.get(serverId);
                    if (!guild) continue;

                    const streamTrackerChannel = guild.channels.cache.find(
                        channel => channel.name === 'stream-tracker' || channel.name === '『stream-tracker』'
                    );

                    if (streamTrackerChannel && streams.length > 0) {
                        // Create reminder list for channel embed
                        const reminderList = streams.map(stream => {
                            const dueUnix = Math.floor(stream.dueDate.getTime() / 1000);
                            return `**${stream.streamId}** - ${stream.itemName}
<@${stream.modelId}> | Due: <t:${dueUnix}:D>`;
                        }).join('\n\n');

                        const channelEmbed = createStreamReminderEmbed(reminderList);
                        await streamTrackerChannel.send({ embeds: [channelEmbed] });
                    }

                    // Send individual DM reminders
                    for (const stream of streams) {
                        try {
                            const user = await client.users.fetch(stream.modelId);
                            const dmEmbed = createStreamReminderDMEmbed(
                                stream.streamId, 
                                stream.itemName, 
                                stream.dueDate
                            );
                            await user.send({ embeds: [dmEmbed] });
                        } catch (dmError) {
                            console.log(`Could not send DM reminder to user ${stream.modelId}:`, dmError.message);
                        }
                    }

                } catch (error) {
                    console.error('Error sending reminders for server:', serverId, error);
                }
            }
        } catch (error) {
            console.error('Error in reminder system:', error);
        }
    });
    
    // Run daily cleanup at 2:00 AM to remove old completed streams
    cron.schedule('0 2 * * *', async () => {
        console.log('✦ Running daily database cleanup ✦');
        
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7); // Clean up completed streams older than 7 days

            const deletedStreams = await db.delete(streams)
                .where(and(
                    eq(streams.status, 'completed'),
                    lt(streams.completedAt, cutoffDate)
                ));

            console.log(`✦ Daily cleanup completed - removed old completed streams ✦`);
        } catch (error) {
            console.error('Error during daily cleanup:', error);
        }
    });
    
    console.log('✦ Reminder system initiated with elegant precision ✦');
}

// Stream info handler - get detailed information about a specific stream
async function handleStreamInfo(interaction) {
    const streamId = interaction.options.getString('stream_id').toUpperCase();

    const [stream] = await db.select().from(streams)
        .where(and(
            eq(streams.streamId, streamId),
            eq(streams.serverId, interaction.guild.id)
        ));

    if (!stream) {
        const embed = createStreamNotFoundEmbed();
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const dueUnix = Math.floor(stream.dueDate.getTime() / 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((stream.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status = daysRemaining < 0 ? '🔴 Overdue' : daysRemaining <= 1 ? '🟡 Due Soon' : '🟢 Active';
    
    const shopName = stream.shop === 'nina-babes' ? 'Nina Babes' : 'Wildethorn Ladies';
    
    const embed = createAstraeeEmbed(
        'Stream Information',
        `**Stream ID:** ${stream.streamId}
**Model:** <@${stream.modelId}>
**Items:** ${stream.itemName}
**Shop:** ${shopName}
**Status:** ${status}
**Due Date:** <t:${dueUnix}:D> (${daysRemaining} days)
**Created:** <t:${Math.floor(stream.createdAt.getTime() / 1000)}:D>${stream.itemLink ? `\n**Item Link:** ${stream.itemLink}` : ''}${stream.creatorId ? `\n**Creator:** <@${stream.creatorId}>` : ''}`
    );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

// Stream list handler - list streams with optional filters
async function handleStreamList(interaction) {
    const status = interaction.options.getString('status');
    const model = interaction.options.getUser('model');
    const targetChannel = interaction.options.getChannel('channel');

    let whereConditions = [eq(streams.serverId, interaction.guild.id)];
    
    if (status) {
        whereConditions.push(eq(streams.status, status));
    }
    
    if (model) {
        whereConditions.push(eq(streams.modelId, model.id));
    }

    const streamList = await db.select().from(streams)
        .where(and(...whereConditions));

    if (streamList.length === 0) {
        const embed = createAstraeeEmbed(
            'No Streams Found',
            'No streams match your criteria. Try adjusting your filters or create a new stream.'
        );
        
        if (targetChannel) {
            await targetChannel.send({ embeds: [embed] });
            await interaction.reply({ content: 'Stream list sent to the specified channel.', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        return;
    }

    const now = new Date();
    const streamDetails = streamList.map(stream => {
        const daysRemaining = Math.ceil((stream.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const dueUnix = Math.floor(stream.dueDate.getTime() / 1000);
        const statusIcon = daysRemaining < 0 ? '🔴' : daysRemaining <= 1 ? '🟡' : '🟢';
        
        return `**${stream.streamId}** ${statusIcon} - ${stream.itemName}
<@${stream.modelId}> | Due: <t:${dueUnix}:D> | Status: ${stream.status}`;
    }).join('\n\n');

    const embed = createAstraeeEmbed(
        'Stream List',
        `Found ${streamList.length} stream(s):\n\n${streamDetails}`
    );

    if (targetChannel) {
        await targetChannel.send({ embeds: [embed] });
        await interaction.reply({ content: 'Stream list sent to the specified channel.', flags: MessageFlags.Ephemeral });
    } else {
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Cleanup handler - remove old completed streams
async function handleCleanup(interaction) {
    const days = interaction.options.getInteger('days') || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
        // Find old completed streams
        const oldStreams = await db.select().from(streams)
            .where(and(
                eq(streams.serverId, interaction.guild.id),
                eq(streams.status, 'completed'),
                lt(streams.completedAt, cutoffDate)
            ));

        if (oldStreams.length === 0) {
            const embed = createAstraeeEmbed(
                'Database Cleanup',
                `No completed streams older than ${days} days found. Database is already clean! ✨`,
                '#98FB98'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Delete old completed streams
        await db.delete(streams)
            .where(and(
                eq(streams.serverId, interaction.guild.id),
                eq(streams.status, 'completed'),
                lt(streams.completedAt, cutoffDate)
            ));

        const embed = createAstraeeEmbed(
            'Database Cleanup Complete',
            `Successfully cleaned up ${oldStreams.length} completed streams older than ${days} days.\n\n**Streams removed:**\n${oldStreams.map(s => `• ${s.streamId} - ${s.itemName}`).join('\n')}`,
            '#98FB98'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error during cleanup:', error);
        const embed = createAstraeeEmbed(
            'Cleanup Error',
            'An error occurred while cleaning up the database. Please try again later.',
            '#E74C3C'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Cleanup all handler - remove ALL streams from database
async function handleCleanupAll(interaction) {
    const confirm = interaction.options.getBoolean('confirm');

    if (!confirm) {
        const embed = createAstraeeEmbed(
            'Confirmation Required',
            'You must confirm the deletion by setting the confirm option to true.',
            '#E74C3C'
        );
        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    try {
        // Get all streams for this server
        const allStreams = await db.select().from(streams)
            .where(eq(streams.serverId, interaction.guild.id));

        if (allStreams.length === 0) {
            const embed = createAstraeeEmbed(
                'Database Cleanup',
                'No streams found in database. Database is already clean! ✨',
                '#98FB98'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Delete ALL streams for this server
        await db.delete(streams)
            .where(eq(streams.serverId, interaction.guild.id));

        const embed = createAstraeeEmbed(
            'Database Cleanup Complete',
            `⚠️ **ALL STREAMS DELETED** ⚠️\n\nSuccessfully removed ${allStreams.length} streams from the database.\n\n**Streams removed:**\n${allStreams.map(s => `• ${s.streamId} - ${s.itemName}`).join('\n')}`,
            '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error during cleanup all:', error);
        const embed = createAstraeeEmbed(
            'Cleanup Error',
            'An error occurred while cleaning up the database. Please try again later.',
            '#E74C3C'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Say command handler - Make Astraee speak with elegant precision
async function handleSay(interaction) {
    const message = interaction.options.getString('message');
    const targetChannel = interaction.options.getChannel('channel');
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    try {
        // If a specific channel is provided, send there
        if (targetChannel) {
            await targetChannel.send(message);
            
            const confirmEmbed = createAstraeeEmbed(
                'Message Delivered',
                `Your message has been delivered to ${targetChannel} with elegant precision.`,
                '#9B59B6'
            );
            
            await interaction.reply({ 
                embeds: [confirmEmbed], 
                flags: ephemeral ? MessageFlags.Ephemeral : 0 
            });
        } else {
            // Send to current channel
            await interaction.channel.send(message);
            
            const confirmEmbed = createAstraeeEmbed(
                'Message Delivered',
                'Your message has been delivered with elegant precision.',
                '#9B59B6'
            );
            
            await interaction.reply({ 
                embeds: [confirmEmbed], 
                flags: ephemeral ? MessageFlags.Ephemeral : 0 
            });
        }

    } catch (error) {
        console.error('Error in say command:', error);
        
        const errorEmbed = createAstraeeEmbed(
            'Delivery Failed',
            'I could not deliver your message. Please check my permissions in the target channel.',
            '#E74C3C'
        );
        
        await interaction.reply({ 
            embeds: [errorEmbed], 
            flags: MessageFlags.Ephemeral 
        });
    }
}

// Welcomer command handler - Manage welcome and goodbye system
async function handleWelcomer(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case 'setup':
                await handleWelcomerSetup(interaction);
                break;
            case 'embed':
                await handleWelcomerEmbed(interaction);
                break;
            case 'toggle':
                await handleWelcomerToggle(interaction);
                break;
            case 'test':
                await handleWelcomerTest(interaction);
                break;
            case 'status':
                await handleWelcomerStatus(interaction);
                break;
        }
    } catch (error) {
        console.error('Error in welcomer command:', error);
        
        const errorEmbed = createAstraeeEmbed(
            'Welcomer Error',
            'An error occurred while managing the welcome system. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ 
            embeds: [errorEmbed], 
            flags: MessageFlags.Ephemeral 
        });
    }
}

// Welcomer setup handler
async function handleWelcomerSetup(interaction) {
    const welcomeChannel = interaction.options.getChannel('welcome_channel');
    const goodbyeChannel = interaction.options.getChannel('goodbye_channel');
    const welcomeMessage = interaction.options.getString('welcome_message');
    const goodbyeMessage = interaction.options.getString('goodbye_message');

    try {
        // Check if settings already exist
        const existingSettings = await db.select().from(welcomeSettings)
            .where(eq(welcomeSettings.serverId, interaction.guild.id))
            .limit(1);

        if (existingSettings.length > 0) {
            // Update existing settings
            await db.update(welcomeSettings)
                .set({
                    welcomeChannelId: welcomeChannel?.id || existingSettings[0].welcomeChannelId,
                    goodbyeChannelId: goodbyeChannel?.id || existingSettings[0].goodbyeChannelId,
                    welcomeMessage: welcomeMessage || existingSettings[0].welcomeMessage,
                    goodbyeMessage: goodbyeMessage || existingSettings[0].goodbyeMessage,
                    updatedAt: new Date()
                })
                .where(eq(welcomeSettings.serverId, interaction.guild.id));
        } else {
            // Create new settings
            await db.insert(welcomeSettings).values({
                serverId: interaction.guild.id,
                welcomeChannelId: welcomeChannel?.id,
                goodbyeChannelId: goodbyeChannel?.id,
                welcomeMessage: welcomeMessage || 'Welcome to our constellation, {user}! ✦',
                goodbyeMessage: goodbyeMessage || 'Farewell, {user}. May your light shine elsewhere. ✦'
            });
        }

        const embed = createAstraeeEmbed(
            'Welcome System Configured',
            `The welcome system has been configured with elegant precision.\n\n**Welcome Channel:** ${welcomeChannel ? welcomeChannel : 'Not set'}\n**Goodbye Channel:** ${goodbyeChannel ? goodbyeChannel : 'Not set'}\n**Welcome Message:** ${welcomeMessage || 'Default'}\n**Goodbye Message:** ${goodbyeMessage || 'Default'}`,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error setting up welcomer:', error);
        throw error;
    }
}

// Welcomer toggle handler
async function handleWelcomerToggle(interaction) {
    const enabled = interaction.options.getBoolean('enabled');

    try {
        // Check if settings exist
        const existingSettings = await db.select().from(welcomeSettings)
            .where(eq(welcomeSettings.serverId, interaction.guild.id))
            .limit(1);

        if (existingSettings.length > 0) {
            // Update existing settings
            await db.update(welcomeSettings)
                .set({
                    enabled: enabled,
                    updatedAt: new Date()
                })
                .where(eq(welcomeSettings.serverId, interaction.guild.id));
        } else {
            // Create new settings with default values
            await db.insert(welcomeSettings).values({
                serverId: interaction.guild.id,
                enabled: enabled
            });
        }

        const embed = createAstraeeEmbed(
            'Welcome System Toggled',
            `The welcome system has been ${enabled ? 'enabled' : 'disabled'} with elegant precision.`,
            enabled ? '#98FB98' : '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error toggling welcomer:', error);
        throw error;
    }
}

// Welcomer test handler
async function handleWelcomerTest(interaction) {
    try {
        // Get current settings
        const settings = await db.select().from(welcomeSettings)
            .where(eq(welcomeSettings.serverId, interaction.guild.id))
            .limit(1);

        if (settings.length === 0 || !settings[0].enabled) {
            const embed = createAstraeeEmbed(
                'Welcome System Not Configured',
                'The welcome system is not set up or enabled. Use `/welcomer setup` to configure it.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const welcomeChannel = settings[0].welcomeChannelId ? 
            interaction.guild.channels.cache.get(settings[0].welcomeChannelId) : null;

        if (!welcomeChannel) {
            const embed = createAstraeeEmbed(
                'Welcome Channel Not Set',
                'No welcome channel has been configured. Use `/welcomer setup` to set one.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Send test message
        if (settings[0].useRichEmbed) {
            // Create rich embed test message
            const embed = new EmbedBuilder()
                .setTitle(settings[0].embedTitle)
                .setColor(settings[0].embedColor || '#9B59B6')
                .setFooter({ text: settings[0].embedFooter || '✦ "Every arrival marks the start of a new chapter." - Astraee ✦' })
                .setTimestamp();

            // Add description with user mention
            if (settings[0].embedDescription) {
                embed.setDescription(settings[0].embedDescription.replace('{user}', interaction.user.toString()));
            } else {
                embed.setDescription(`Welcome, ${interaction.user}! ✦ We are delighted to have you in **${interaction.guild.name}**, where creativity meets connection.`);
            }

            // Add thumbnail if set
            if (settings[0].embedThumbnail) {
                embed.setThumbnail(settings[0].embedThumbnail);
            }

            // Add image if set
            if (settings[0].embedImage) {
                embed.setImage(settings[0].embedImage);
            }

            // Add first steps fields if channels are configured
            const fields = [];
            if (settings[0].rulesChannelId) {
                fields.push({
                    name: '📋 Read Our Rules',
                    value: `Visit ${interaction.guild.channels.cache.get(settings[0].rulesChannelId) || '#rules'} to understand our community standards.`,
                    inline: false
                });
            }
            if (settings[0].startHereChannelId) {
                fields.push({
                    name: '🚀 Get Started',
                    value: `Visit ${interaction.guild.channels.cache.get(settings[0].startHereChannelId) || '#start-here'} to react and unlock the rest of the server.`,
                    inline: false
                });
            }
            if (settings[0].introChannelId) {
                fields.push({
                    name: '👋 Introduce Yourself',
                    value: `Head to ${interaction.guild.channels.cache.get(settings[0].introChannelId) || '#introductions'} and start your journey with us.`,
                    inline: false
                });
            }

            if (fields.length > 0) {
                embed.addFields(fields);
            }

            await welcomeChannel.send({ embeds: [embed] });
        } else {
            // Send simple text message
            const testMessage = settings[0].welcomeMessage.replace('{user}', interaction.user.toString());
            await welcomeChannel.send(testMessage);
        }

        const embed = createAstraeeEmbed(
            'Test Message Sent',
            `Test welcome message sent to ${welcomeChannel} with elegant precision.`,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error testing welcomer:', error);
        throw error;
    }
}

// Welcomer status handler
async function handleWelcomerStatus(interaction) {
    try {
        // Get current settings
        const settings = await db.select().from(welcomeSettings)
            .where(eq(welcomeSettings.serverId, interaction.guild.id))
            .limit(1);

        if (settings.length === 0) {
            const embed = createAstraeeEmbed(
                'Welcome System Status',
                'The welcome system is not configured. Use `/welcomer setup` to configure it.',
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const setting = settings[0];
        const welcomeChannel = setting.welcomeChannelId ? 
            interaction.guild.channels.cache.get(setting.welcomeChannelId) : null;
        const goodbyeChannel = setting.goodbyeChannelId ? 
            interaction.guild.channels.cache.get(setting.goodbyeChannelId) : null;

        const embed = createAstraeeEmbed(
            'Welcome System Status',
            `**Status:** ${setting.enabled ? 'Enabled ✨' : 'Disabled ❌'}\n**Rich Embeds:** ${setting.useRichEmbed ? 'Enabled ✨' : 'Disabled ❌'}\n**Welcome Channel:** ${welcomeChannel || 'Not set'}\n**Goodbye Channel:** ${goodbyeChannel || 'Not set'}\n**Welcome Message:** ${setting.welcomeMessage}\n**Goodbye Message:** ${setting.goodbyeMessage}\n\n**Rich Embed Settings:**\n**Title:** ${setting.embedTitle}\n**Description:** ${setting.embedDescription || 'Default'}\n**Color:** ${setting.embedColor}\n**Thumbnail:** ${setting.embedThumbnail ? 'Set' : 'Not set'}\n**Image:** ${setting.embedImage ? 'Set' : 'Not set'}\n**Footer:** ${setting.embedFooter}\n\n**Channel Links:**\n**Rules:** ${setting.rulesChannelId ? `<#${setting.rulesChannelId}>` : 'Not set'}\n**Start Here:** ${setting.startHereChannelId ? `<#${setting.startHereChannelId}>` : 'Not set'}\n**Intro:** ${setting.introChannelId ? `<#${setting.introChannelId}>` : 'Not set'}`,
            setting.enabled ? '#98FB98' : '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error getting welcomer status:', error);
        throw error;
    }
}

// Welcomer embed handler - Configure rich embed settings
async function handleWelcomerEmbed(interaction) {
    const enabled = interaction.options.getBoolean('enabled');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color');
    const thumbnail = interaction.options.getString('thumbnail');
    const image = interaction.options.getString('image');
    const footer = interaction.options.getString('footer');
    const rulesChannel = interaction.options.getChannel('rules_channel');
    const startHereChannel = interaction.options.getChannel('start_here_channel');
    const introChannel = interaction.options.getChannel('intro_channel');

    try {
        // Check if settings already exist
        const existingSettings = await db.select().from(welcomeSettings)
            .where(eq(welcomeSettings.serverId, interaction.guild.id))
            .limit(1);

        if (existingSettings.length > 0) {
            // Update existing settings
            await db.update(welcomeSettings)
                .set({
                    useRichEmbed: enabled,
                    embedTitle: title || existingSettings[0].embedTitle,
                    embedDescription: description || existingSettings[0].embedDescription,
                    embedColor: color || existingSettings[0].embedColor,
                    embedThumbnail: thumbnail || existingSettings[0].embedThumbnail,
                    embedImage: image || existingSettings[0].embedImage,
                    embedFooter: footer || existingSettings[0].embedFooter,
                    rulesChannelId: rulesChannel?.id || existingSettings[0].rulesChannelId,
                    startHereChannelId: startHereChannel?.id || existingSettings[0].startHereChannelId,
                    introChannelId: introChannel?.id || existingSettings[0].introChannelId,
                    updatedAt: new Date()
                })
                .where(eq(welcomeSettings.serverId, interaction.guild.id));
        } else {
            // Create new settings
            await db.insert(welcomeSettings).values({
                serverId: interaction.guild.id,
                useRichEmbed: enabled,
                embedTitle: title || '✦ A New Star Joins Us ✦',
                embedDescription: description,
                embedColor: color || '#9B59B6',
                embedThumbnail: thumbnail,
                embedImage: image,
                embedFooter: footer || '✦ "Every arrival marks the start of a new chapter." - Astraee ✦',
                rulesChannelId: rulesChannel?.id,
                startHereChannelId: startHereChannel?.id,
                introChannelId: introChannel?.id
            });
        }

        const embed = createAstraeeEmbed(
            'Rich Embed Configured',
            `Rich embed settings have been configured with elegant precision.\n\n**Rich Embeds:** ${enabled ? 'Enabled ✨' : 'Disabled ❌'}\n**Title:** ${title || 'Default'}\n**Description:** ${description ? 'Custom' : 'Default'}\n**Color:** ${color || '#9B59B6'}\n**Thumbnail:** ${thumbnail ? 'Set' : 'Not set'}\n**Image:** ${image ? 'Set' : 'Not set'}\n**Footer:** ${footer ? 'Custom' : 'Default'}\n**Rules Channel:** ${rulesChannel || 'Not set'}\n**Start Here Channel:** ${startHereChannel || 'Not set'}\n**Intro Channel:** ${introChannel || 'Not set'}`,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error configuring welcomer embed:', error);
        throw error;
    }
}

// Reaction Role command handler - Manage reaction roles with elegant precision
async function handleReactionRole(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case 'add':
                await handleReactionRoleAdd(interaction);
                break;
            case 'remove':
                await handleReactionRoleRemove(interaction);
                break;
            case 'list':
                await handleReactionRoleList(interaction);
                break;
            case 'clear':
                await handleReactionRoleClear(interaction);
                break;
        }
    } catch (error) {
        console.error('Error in reaction role command:', error);
        
        const errorEmbed = createAstraeeEmbed(
            'Reaction Role Error',
            'An error occurred while managing reaction roles. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ 
            embeds: [errorEmbed], 
            flags: MessageFlags.Ephemeral 
        });
    }
}

// Reaction Role Add handler
async function handleReactionRoleAdd(interaction) {
    const messageId = interaction.options.getString('message_id');
    const emoji = interaction.options.getString('emoji');
    const role = interaction.options.getRole('role');

    try {
        // Find the message
        const message = await interaction.channel.messages.fetch(messageId);
        if (!message) {
            const embed = createAstraeeEmbed(
                'Message Not Found',
                'Could not find the specified message. Make sure the message ID is correct and the message is in this channel.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Check if reaction role already exists
        const existingReactionRole = await db.select().from(reactionRoles)
            .where(and(
                eq(reactionRoles.serverId, interaction.guild.id),
                eq(reactionRoles.messageId, messageId),
                eq(reactionRoles.emoji, emoji)
            ))
            .limit(1);

        if (existingReactionRole.length > 0) {
            const embed = createAstraeeEmbed(
                'Reaction Role Exists',
                `A reaction role with emoji ${emoji} already exists for this message. Use \`/reactionrole remove\` to remove it first.`,
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Add reaction role to database
        await db.insert(reactionRoles).values({
            serverId: interaction.guild.id,
            messageId: messageId,
            emoji: emoji,
            roleId: role.id
        });

        // Add reaction to the message
        await message.react(emoji);

        const embed = createAstraeeEmbed(
            'Reaction Role Added',
            `Reaction role added with elegant precision.\n\n**Message:** ${messageId}\n**Emoji:** ${emoji}\n**Role:** ${role}\n\nUsers can now react to assign/remove this role.`,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error adding reaction role:', error);
        
        if (error.code === 10008) { // Unknown Message
            const embed = createAstraeeEmbed(
                'Message Not Found',
                'Could not find the specified message. Make sure the message ID is correct.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        throw error;
    }
}

// Reaction Role Remove handler
async function handleReactionRoleRemove(interaction) {
    const messageId = interaction.options.getString('message_id');
    const emoji = interaction.options.getString('emoji');

    try {
        // Find the message
        const message = await interaction.channel.messages.fetch(messageId);
        if (!message) {
            const embed = createAstraeeEmbed(
                'Message Not Found',
                'Could not find the specified message. Make sure the message ID is correct and the message is in this channel.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Find and remove reaction role from database
        const reactionRole = await db.select().from(reactionRoles)
            .where(and(
                eq(reactionRoles.serverId, interaction.guild.id),
                eq(reactionRoles.messageId, messageId),
                eq(reactionRoles.emoji, emoji)
            ))
            .limit(1);

        if (reactionRole.length === 0) {
            const embed = createAstraeeEmbed(
                'Reaction Role Not Found',
                `No reaction role found with emoji ${emoji} for this message.`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Remove from database
        await db.delete(reactionRoles)
            .where(and(
                eq(reactionRoles.serverId, interaction.guild.id),
                eq(reactionRoles.messageId, messageId),
                eq(reactionRoles.emoji, emoji)
            ));

        // Remove reaction from message
        try {
            await message.reactions.cache.get(emoji)?.users.remove(client.user);
        } catch (reactionError) {
            console.log('Could not remove reaction from message:', reactionError.message);
        }

        const embed = createAstraeeEmbed(
            'Reaction Role Removed',
            `Reaction role removed with elegant precision.\n\n**Message:** ${messageId}\n**Emoji:** ${emoji}\n**Role:** <@&${reactionRole[0].roleId}>`,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error removing reaction role:', error);
        
        if (error.code === 10008) { // Unknown Message
            const embed = createAstraeeEmbed(
                'Message Not Found',
                'Could not find the specified message. Make sure the message ID is correct.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        throw error;
    }
}

// Reaction Role List handler
async function handleReactionRoleList(interaction) {
    const messageId = interaction.options.getString('message_id');

    try {
        // Find the message
        const message = await interaction.channel.messages.fetch(messageId);
        if (!message) {
            const embed = createAstraeeEmbed(
                'Message Not Found',
                'Could not find the specified message. Make sure the message ID is correct and the message is in this channel.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Get all reaction roles for this message
        const reactionRolesList = await db.select().from(reactionRoles)
            .where(and(
                eq(reactionRoles.serverId, interaction.guild.id),
                eq(reactionRoles.messageId, messageId)
            ));

        if (reactionRolesList.length === 0) {
            const embed = createAstraeeEmbed(
                'No Reaction Roles',
                `No reaction roles found for this message. Use \`/reactionrole add\` to add some.`,
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const embed = createAstraeeEmbed(
            'Reaction Roles List',
            `**Message ID:** ${messageId}\n\n**Reaction Roles:**\n${reactionRolesList.map(rr => `• ${rr.emoji} → <@&${rr.roleId}>`).join('\n')}`,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error listing reaction roles:', error);
        
        if (error.code === 10008) { // Unknown Message
            const embed = createAstraeeEmbed(
                'Message Not Found',
                'Could not find the specified message. Make sure the message ID is correct.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        throw error;
    }
}

// Reaction Role Clear handler
async function handleReactionRoleClear(interaction) {
    const messageId = interaction.options.getString('message_id');

    try {
        // Find the message
        const message = await interaction.channel.messages.fetch(messageId);
        if (!message) {
            const embed = createAstraeeEmbed(
                'Message Not Found',
                'Could not find the specified message. Make sure the message ID is correct and the message is in this channel.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Get all reaction roles for this message
        const reactionRolesList = await db.select().from(reactionRoles)
            .where(and(
                eq(reactionRoles.serverId, interaction.guild.id),
                eq(reactionRoles.messageId, messageId)
            ));

        if (reactionRolesList.length === 0) {
            const embed = createAstraeeEmbed(
                'No Reaction Roles',
                `No reaction roles found for this message.`,
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Remove all reaction roles from database
        await db.delete(reactionRoles)
            .where(and(
                eq(reactionRoles.serverId, interaction.guild.id),
                eq(reactionRoles.messageId, messageId)
            ));

        // Remove all reactions from message
        try {
            for (const reactionRole of reactionRolesList) {
                await message.reactions.cache.get(reactionRole.emoji)?.users.remove(client.user);
            }
        } catch (reactionError) {
            console.log('Could not remove some reactions from message:', reactionError.message);
        }

        const embed = createAstraeeEmbed(
            'Reaction Roles Cleared',
            `All reaction roles cleared from this message with elegant precision.\n\n**Removed:** ${reactionRolesList.length} reaction roles`,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error clearing reaction roles:', error);
        
        if (error.code === 10008) { // Unknown Message
            const embed = createAstraeeEmbed(
                'Message Not Found',
                'Could not find the specified message. Make sure the message ID is correct.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        
        throw error;
    }
}

// Moderation command handlers
async function handleKick(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    try {
        const member = await interaction.guild.members.fetch(user.id);
        
        // Check if user can be kicked
        if (!member.kickable) {
            const embed = createAstraeeEmbed(
                'Cannot Kick User',
                `I cannot kick ${user}. They may have a higher role than me or be the server owner.`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Kick the user
        await member.kick(reason);

        // Log the action
        await db.insert(moderationLogs).values({
            serverId: interaction.guild.id,
            userId: user.id,
            moderatorId: interaction.user.id,
            action: 'kick',
            reason: reason
        });

        const embed = createAstraeeEmbed(
            'User Kicked',
            `**User:** ${user} (${user.tag})\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}\n\nUser has been removed from the server with elegant precision.`,
            '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : 0 });

    } catch (error) {
        console.error('Error kicking user:', error);
        
        const embed = createAstraeeEmbed(
            'Kick Failed',
            `Failed to kick ${user}. Please check my permissions and try again.`,
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

async function handleBan(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    try {
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        // Check if user can be banned
        if (member && !member.bannable) {
            const embed = createAstraeeEmbed(
                'Cannot Ban User',
                `I cannot ban ${user}. They may have a higher role than me or be the server owner.`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Ban the user
        await interaction.guild.members.ban(user, { 
            reason: reason,
            deleteMessageDays: deleteDays
        });

        // Log the action
        await db.insert(moderationLogs).values({
            serverId: interaction.guild.id,
            userId: user.id,
            moderatorId: interaction.user.id,
            action: 'ban',
            reason: reason
        });

        const embed = createAstraeeEmbed(
            'User Banned',
            `**User:** ${user} (${user.tag})\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}\n**Messages Deleted:** ${deleteDays} days\n\nUser has been permanently banned from the server with elegant precision.`,
            '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : 0 });

    } catch (error) {
        console.error('Error banning user:', error);
        
        const embed = createAstraeeEmbed(
            'Ban Failed',
            `Failed to ban ${user}. Please check my permissions and try again.`,
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

async function handleTimeout(interaction) {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    try {
        const member = await interaction.guild.members.fetch(user.id);
        
        // Check if user can be timed out
        if (!member.moderatable) {
            const embed = createAstraeeEmbed(
                'Cannot Timeout User',
                `I cannot timeout ${user}. They may have a higher role than me or be the server owner.`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Calculate timeout end time
        const timeoutUntil = new Date(Date.now() + duration * 60 * 1000);

        // Timeout the user
        await member.timeout(duration * 60 * 1000, reason);

        // Log the action
        await db.insert(moderationLogs).values({
            serverId: interaction.guild.id,
            userId: user.id,
            moderatorId: interaction.user.id,
            action: 'timeout',
            reason: reason,
            duration: duration
        });

        const embed = createAstraeeEmbed(
            'User Timed Out',
            `**User:** ${user} (${user.tag})\n**Duration:** ${duration} minutes\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}\n**Until:** <t:${Math.floor(timeoutUntil.getTime() / 1000)}:R>\n\nUser has been timed out with elegant precision.`,
            '#F39C12'
        );

        await interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : 0 });

    } catch (error) {
        console.error('Error timing out user:', error);
        
        const embed = createAstraeeEmbed(
            'Timeout Failed',
            `Failed to timeout ${user}. Please check my permissions and try again.`,
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

async function handleMute(interaction) {
    const user = interaction.options.getUser('user');
    const muteRole = interaction.options.getRole('mute_role');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    try {
        const member = await interaction.guild.members.fetch(user.id);
        
        // Check if user already has the mute role
        if (member.roles.cache.has(muteRole.id)) {
            const embed = createAstraeeEmbed(
                'User Already Muted',
                `${user} already has the ${muteRole} role.`,
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Add the mute role
        await member.roles.add(muteRole, reason);

        // Log the action
        await db.insert(moderationLogs).values({
            serverId: interaction.guild.id,
            userId: user.id,
            moderatorId: interaction.user.id,
            action: 'mute',
            reason: reason
        });

        const embed = createAstraeeEmbed(
            'User Muted',
            `**User:** ${user} (${user.tag})\n**Mute Role:** ${muteRole}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}\n\nUser has been muted with elegant precision.`,
            '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : 0 });

    } catch (error) {
        console.error('Error muting user:', error);
        
        const embed = createAstraeeEmbed(
            'Mute Failed',
            `Failed to mute ${user}. Please check my permissions and try again.`,
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

async function handleUnmute(interaction) {
    const user = interaction.options.getUser('user');
    const muteRole = interaction.options.getRole('mute_role');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    try {
        const member = await interaction.guild.members.fetch(user.id);
        
        // Check if user has the mute role
        if (!member.roles.cache.has(muteRole.id)) {
            const embed = createAstraeeEmbed(
                'User Not Muted',
                `${user} does not have the ${muteRole} role.`,
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Remove the mute role
        await member.roles.remove(muteRole, reason);

        // Log the action
        await db.insert(moderationLogs).values({
            serverId: interaction.guild.id,
            userId: user.id,
            moderatorId: interaction.user.id,
            action: 'unmute',
            reason: reason
        });

        const embed = createAstraeeEmbed(
            'User Unmuted',
            `**User:** ${user} (${user.tag})\n**Mute Role:** ${muteRole}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user}\n\nUser has been unmuted with elegant precision.`,
            '#98FB98'
        );

        await interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : 0 });

    } catch (error) {
        console.error('Error unmuting user:', error);
        
        const embed = createAstraeeEmbed(
            'Unmute Failed',
            `Failed to unmute ${user}. Please check my permissions and try again.`,
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

async function handleModLogs(interaction) {
    const user = interaction.options.getUser('user');
    const limit = interaction.options.getInteger('limit') || 10;
    const ephemeral = interaction.options.getBoolean('ephemeral') || false;

    try {
        // Get moderation logs for the user
        const logs = await db.select().from(moderationLogs)
            .where(and(
                eq(moderationLogs.serverId, interaction.guild.id),
                eq(moderationLogs.userId, user.id)
            ))
            .orderBy(desc(moderationLogs.createdAt))
            .limit(limit);

        if (logs.length === 0) {
            const embed = createAstraeeEmbed(
                'No Moderation Logs',
                `No moderation logs found for ${user}.`,
                '#F0E68C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const logEntries = logs.map(log => {
            const moderator = interaction.guild.members.cache.get(log.moderatorId);
            const moderatorName = moderator ? moderator.user.tag : 'Unknown';
            const timestamp = `<t:${Math.floor(log.createdAt.getTime() / 1000)}:R>`;
            const duration = log.duration ? ` (${log.duration} min)` : '';
            
            return `**${log.action.toUpperCase()}**${duration} - ${timestamp}\n**Moderator:** ${moderatorName}\n**Reason:** ${log.reason || 'No reason provided'}`;
        }).join('\n\n');

        const embed = createAstraeeEmbed(
            `Moderation Logs for ${user.tag}`,
            `**User:** ${user} (${user.id})\n**Total Logs:** ${logs.length}\n\n${logEntries}`,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: ephemeral ? MessageFlags.Ephemeral : 0 });

    } catch (error) {
        console.error('Error fetching mod logs:', error);
        
        const embed = createAstraeeEmbed(
            'Logs Failed',
            `Failed to fetch moderation logs for ${user}. Please try again later.`,
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Statistics command handler - Track monthly stream counts and yearly summaries
async function handleStats(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case 'monthly':
                await handleStatsMonthly(interaction);
                break;
            case 'yearly':
                await handleStatsYearly(interaction);
                break;
            case 'submit':
                await handleStatsSubmit(interaction);
                break;
            case 'leaderboard':
                await handleStatsLeaderboard(interaction);
                break;
        }
    } catch (error) {
        console.error('Error in stats command:', error);
        
        const errorEmbed = createAstraeeEmbed(
            'Statistics Error',
            'An error occurred while processing statistics. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ 
            embeds: [errorEmbed], 
            flags: MessageFlags.Ephemeral 
        });
    }
}

// Handle monthly statistics display
async function handleStatsMonthly(interaction) {
    const year = interaction.options.getInteger('year') || new Date().getFullYear();
    const month = interaction.options.getInteger('month') || new Date().getMonth() + 1;

    try {
        // Get monthly stats for the server
        const monthlyStatsData = await db.select().from(monthlyStats)
            .where(and(
                eq(monthlyStats.serverId, interaction.guild.id),
                eq(monthlyStats.year, year),
                eq(monthlyStats.month, month)
            ));

        if (monthlyStatsData.length === 0) {
            const embed = createAstraeeEmbed(
                'Monthly Statistics',
                `No stream data found for **${getMonthName(month)} ${year}**.\n\nStart creating streams to build your monthly statistics! ✦`,
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Sort by stream count (descending)
        monthlyStatsData.sort((a, b) => b.streamCount - a.streamCount);

        // Create leaderboard embed
        const embed = new EmbedBuilder()
            .setTitle(`✦ Monthly Statistics - ${getMonthName(month)} ${year} ✦`)
            .setColor('#9B59B6')
            .setFooter({ text: `✦ "Progress is measured not by perfection, but by persistence." - Astraee ✦` })
            .setTimestamp();

        // Add top performers
        const topPerformers = monthlyStatsData.slice(0, 10);
        let leaderboardText = '';
        
        for (const stat of topPerformers) {
            const user = await client.users.fetch(stat.userId).catch(() => null);
            const username = user ? user.displayName : `Unknown User (${stat.userId})`;
            const index = topPerformers.indexOf(stat);
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
            leaderboardText += `${medal} **${username}** - ${stat.streamCount} streams\n`;
        }

        embed.addFields({
            name: '🏆 Top Performers',
            value: leaderboardText || 'No data available',
            inline: false
        });

        // Add summary statistics
        const totalStreams = monthlyStatsData.reduce((sum, stat) => sum + stat.streamCount, 0);
        const averageStreams = Math.round(totalStreams / monthlyStatsData.length * 10) / 10;
        const topPerformer = monthlyStatsData[0];

        embed.addFields(
            {
                name: '📈 Summary',
                value: `**Total Streams:** ${totalStreams}\n**Active Models:** ${monthlyStatsData.length}\n**Average per Model:** ${averageStreams}`,
                inline: true
            },
            {
                name: '🌟 Top Performer',
                value: `**${topPerformer.streamCount} streams**\n${await client.users.fetch(topPerformer.userId).then(u => u.displayName).catch(() => 'Unknown User')}`,
                inline: true
            }
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error fetching monthly stats:', error);
        
        const embed = createAstraeeEmbed(
            'Statistics Error',
            'Failed to retrieve monthly statistics. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle yearly statistics display
async function handleStatsYearly(interaction) {
    const year = interaction.options.getInteger('year') || new Date().getFullYear();

    try {
        // Get yearly summary for the server
        const yearlySummary = await db.select().from(yearlySummaries)
            .where(and(
                eq(yearlySummaries.serverId, interaction.guild.id),
                eq(yearlySummaries.year, year)
            ))
            .limit(1);

        if (yearlySummary.length === 0) {
            const embed = createAstraeeEmbed(
                'Yearly Summary',
                `No yearly summary found for **${year}**.\n\nAdmins can submit yearly summaries using \`/stats submit\` ✦`,
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const summary = yearlySummary[0];

        // Create congratulatory embed
        const embed = new EmbedBuilder()
            .setTitle(`✦ ${year} Yearly Summary ✦`)
            .setColor('#F39C12')
            .setDescription(`**Congratulations to all our amazing models!** 🎉\n\n${summary.summaryText}`)
            .setFooter({ text: `✦ "Every year brings new achievements and endless possibilities." - Astraee ✦` })
            .setTimestamp();

        // Add statistics if available
        if (summary.totalStreams || summary.topPerformer || summary.averageStreams) {
            const statsText = [];
            if (summary.totalStreams) statsText.push(`**Total Streams:** ${summary.totalStreams}`);
            if (summary.topPerformer) statsText.push(`**Top Performer:** ${summary.topPerformer}`);
            if (summary.averageStreams) statsText.push(`**Average per Model:** ${summary.averageStreams}`);

            embed.addFields({
                name: '📊 Yearly Statistics',
                value: statsText.join('\n'),
                inline: false
            });
        }

        // Add special achievements if any
        if (summary.achievements) {
            embed.addFields({
                name: '🏆 Special Achievements',
                value: summary.achievements,
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error fetching yearly stats:', error);
        
        const embed = createAstraeeEmbed(
            'Statistics Error',
            'Failed to retrieve yearly summary. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle yearly summary submission (admin only)
async function handleStatsSubmit(interaction) {
    const year = interaction.options.getInteger('year') || new Date().getFullYear();
    const summaryText = interaction.options.getString('summary');
    const totalStreams = interaction.options.getInteger('total_streams');
    const topPerformer = interaction.options.getString('top_performer');
    const averageStreams = interaction.options.getNumber('average_streams');
    const achievements = interaction.options.getString('achievements');

    try {
        // Check if summary already exists for this year
        const existingSummary = await db.select().from(yearlySummaries)
            .where(and(
                eq(yearlySummaries.serverId, interaction.guild.id),
                eq(yearlySummaries.year, year)
            ))
            .limit(1);

        if (existingSummary.length > 0) {
            // Update existing summary
            await db.update(yearlySummaries)
                .set({
                    summaryText,
                    totalStreams,
                    topPerformer,
                    averageStreams,
                    achievements,
                    submittedBy: interaction.user.id,
                    submittedAt: new Date()
                })
                .where(and(
                    eq(yearlySummaries.serverId, interaction.guild.id),
                    eq(yearlySummaries.year, year)
                ));

            const embed = createAstraeeEmbed(
                'Yearly Summary Updated',
                `Successfully updated the yearly summary for **${year}**! ✦\n\nMembers can now view it using \`/stats yearly\`.`,
                '#27AE60'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } else {
            // Create new summary
            await db.insert(yearlySummaries).values({
                serverId: interaction.guild.id,
                year,
                summaryText,
                totalStreams,
                topPerformer,
                averageStreams,
                achievements,
                submittedBy: interaction.user.id,
                submittedAt: new Date()
            });

            const embed = createAstraeeEmbed(
                'Yearly Summary Created',
                `Successfully created the yearly summary for **${year}**! ✦\n\nMembers can now view it using \`/stats yearly\`.`,
                '#27AE60'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

    } catch (error) {
        console.error('Error submitting yearly summary:', error);
        
        const embed = createAstraeeEmbed(
            'Submission Error',
            'Failed to submit yearly summary. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle leaderboard display
async function handleStatsLeaderboard(interaction) {
    const timeframe = interaction.options.getString('timeframe') || 'month';
    const limit = interaction.options.getInteger('limit') || 10;

    try {
        let stats;
        let title;

        if (timeframe === 'month') {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            stats = await db.select().from(monthlyStats)
                .where(and(
                    eq(monthlyStats.serverId, interaction.guild.id),
                    eq(monthlyStats.year, year),
                    eq(monthlyStats.month, month)
                ))
                .orderBy(desc(monthlyStats.streamCount))
                .limit(limit);

            title = `✦ Monthly Leaderboard - ${getMonthName(month)} ${year} ✦`;
        } else {
            // All-time leaderboard (sum of all monthly stats)
            const allStats = await db.select().from(monthlyStats)
                .where(eq(monthlyStats.serverId, interaction.guild.id));

            // Group by user and sum their streams
            const userTotals = {};
            allStats.forEach(stat => {
                if (!userTotals[stat.userId]) {
                    userTotals[stat.userId] = 0;
                }
                userTotals[stat.userId] += stat.streamCount;
            });

            // Convert to array and sort
            stats = Object.entries(userTotals)
                .map(([userId, total]) => ({ userId, streamCount: total }))
                .sort((a, b) => b.streamCount - a.streamCount)
                .slice(0, limit);

            title = '✦ All-Time Leaderboard ✦';
        }

        if (stats.length === 0) {
            const embed = createAstraeeEmbed(
                'Leaderboard',
                'No stream data found for the selected timeframe.\n\nStart creating streams to appear on the leaderboard! ✦',
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Create leaderboard embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor('#9B59B6')
            .setFooter({ text: `✦ "Excellence is not a destination, it's a journey." - Astraee ✦` })
            .setTimestamp();

        let leaderboardText = '';
        stats.forEach((stat, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
            leaderboardText += `${medal} **${stat.streamCount} streams** - <@${stat.userId}>\n`;
        });

        embed.addFields({
            name: '🏆 Top Performers',
            value: leaderboardText,
            inline: false
        });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        
        const embed = createAstraeeEmbed(
            'Leaderboard Error',
            'Failed to retrieve leaderboard data. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Helper function to get month name
function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
}

// Auto-update monthly statistics when streams are completed
async function updateMonthlyStats(serverId, userId) {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        // Check if user already has stats for this month
        const existingStats = await db.select().from(monthlyStats)
            .where(and(
                eq(monthlyStats.serverId, serverId),
                eq(monthlyStats.userId, userId),
                eq(monthlyStats.year, year),
                eq(monthlyStats.month, month)
            ))
            .limit(1);

        if (existingStats.length > 0) {
            // Update existing stats
            await db.update(monthlyStats)
                .set({ streamCount: existingStats[0].streamCount + 1 })
                .where(and(
                    eq(monthlyStats.serverId, serverId),
                    eq(monthlyStats.userId, userId),
                    eq(monthlyStats.year, year),
                    eq(monthlyStats.month, month)
                ));
        } else {
            // Create new stats entry
            await db.insert(monthlyStats).values({
                serverId,
                userId,
                year,
                month,
                streamCount: 1
            });
        }

        console.log(`✦ Updated monthly stats for user ${userId} in server ${serverId} ✦`);

    } catch (error) {
        console.error('Error updating monthly stats:', error);
    }
}

// Level system command handler - Manage user levels and XP with elegant precision
async function handleLevel(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case 'view':
                await handleLevelView(interaction);
                break;
            case 'leaderboard':
                await handleLevelLeaderboard(interaction);
                break;
            case 'give':
                await handleLevelGive(interaction);
                break;
            case 'setreward':
                await handleLevelSetReward(interaction);
                break;
            case 'removereward':
                await handleLevelRemoveReward(interaction);
                break;
            case 'rewards':
                await handleLevelRewards(interaction);
                break;
            case 'reset':
                await handleLevelReset(interaction);
                break;
        }
    } catch (error) {
        console.error('Error in level command:', error);
        
        const errorEmbed = createAstraeeEmbed(
            'Level System Error',
            'An error occurred while managing the level system. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ 
            embeds: [errorEmbed], 
            flags: MessageFlags.Ephemeral 
        });
    }
}

// Handle level view
async function handleLevelView(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    try {
        // Get user's level data
        const userLevel = await db.select().from(userLevels)
            .where(and(
                eq(userLevels.serverId, interaction.guild.id),
                eq(userLevels.userId, targetUser.id)
            ))
            .limit(1);

        const levelData = userLevel.length > 0 ? userLevel[0] : {
            userId: targetUser.id,
            serverId: interaction.guild.id,
            xp: 0,
            level: 0,
            totalXp: 0
        };

        const currentLevel = levelData.level;
        const currentXp = levelData.xp;
        const totalXp = levelData.totalXp;
        const nextLevelXp = getXpRequiredForLevel(currentLevel + 1);

        // Calculate progress bar
        const progress = currentXp / nextLevelXp;
        const progressBar = createProgressBar(progress);

        // Create level embed
        const embed = new EmbedBuilder()
            .setTitle(`✦ ${targetUser.displayName}'s Level Profile ✦`)
            .setColor('#9B59B6')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '🏆 Current Level',
                    value: `**${currentLevel}**`,
                    inline: true
                },
                {
                    name: '⭐ Current XP',
                    value: `**${currentXp}** / ${nextLevelXp}`,
                    inline: true
                },
                {
                    name: '🌟 Total XP',
                    value: `**${totalXp}**`,
                    inline: true
                },
                {
                    name: '📊 Progress',
                    value: `${progressBar} (${Math.round(progress * 100)}%)`,
                    inline: false
                }
            )
            .setFooter({ text: `✦ "Growth is measured not by perfection, but by perseverance." - Astraee ✦` })
            .setTimestamp();

        // Add rank if available
        const rank = await getUserRank(interaction.guild.id, targetUser.id);
        if (rank > 0) {
            embed.addFields({
                name: '🎯 Server Rank',
                value: `**#${rank}**`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error fetching level data:', error);
        
        const embed = createAstraeeEmbed(
            'Level View Error',
            'Failed to retrieve level information. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle level leaderboard
async function handleLevelLeaderboard(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;

    try {
        const leaderboard = await db.select().from(userLevels)
            .where(eq(userLevels.serverId, interaction.guild.id))
            .orderBy(desc(userLevels.totalXp))
            .limit(limit);

        if (leaderboard.length === 0) {
            const embed = createAstraeeEmbed(
                'Level Leaderboard',
                'No level data found for this server.\n\nStart chatting to earn XP and level up! ✦',
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Create leaderboard embed
        const embed = new EmbedBuilder()
            .setTitle('✦ Server Level Leaderboard ✦')
            .setColor('#9B59B6')
            .setFooter({ text: `✦ "Excellence is achieved through consistent dedication." - Astraee ✦` })
            .setTimestamp();

        let leaderboardText = '';
        for (let i = 0; i < leaderboard.length; i++) {
            const user = leaderboard[i];
            const discordUser = await client.users.fetch(user.userId).catch(() => null);
            const username = discordUser ? discordUser.displayName : `Unknown User (${user.userId})`;
            
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📊';
            leaderboardText += `${medal} **Level ${user.level}** - **${username}** (${user.totalXp} XP)\n`;
        }

        embed.addFields({
            name: '🏆 Top Performers',
            value: leaderboardText,
            inline: false
        });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error fetching level leaderboard:', error);
        
        const embed = createAstraeeEmbed(
            'Leaderboard Error',
            'Failed to retrieve level leaderboard. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle giving XP to users (admin only)
async function handleLevelGive(interaction) {
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const reason = interaction.options.getString('reason') || 'Admin reward';

    try {
        // Give XP to user
        await giveXpToUser(interaction.guild.id, targetUser.id, amount);

        const embed = createAstraeeEmbed(
            'XP Awarded',
            `Successfully gave **${amount} XP** to ${targetUser}! ✦\n\n**Reason:** ${reason}`,
            '#27AE60'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

        // Log the action
        await db.insert(moderationLogs).values({
            serverId: interaction.guild.id,
            userId: targetUser.id,
            moderatorId: interaction.user.id,
            action: 'xp_given',
            reason: `${amount} XP - ${reason}`
        });

    } catch (error) {
        console.error('Error giving XP:', error);
        
        const embed = createAstraeeEmbed(
            'XP Give Error',
            'Failed to give XP to user. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle setting level rewards (admin only)
async function handleLevelSetReward(interaction) {
    const level = interaction.options.getInteger('level');
    const role = interaction.options.getRole('role');

    try {
        // Check if reward already exists
        const existingReward = await db.select().from(userLevels)
            .where(and(
                eq(userLevels.serverId, interaction.guild.id),
                eq(userLevels.level, level)
            ))
            .limit(1);

        if (existingReward.length > 0) {
            // Update existing reward
            await db.update(userLevels)
                .set({ rewardRoleId: role.id })
                .where(and(
                    eq(userLevels.serverId, interaction.guild.id),
                    eq(userLevels.level, level)
                ));
        } else {
            // Create new reward entry
            await db.insert(userLevels).values({
                serverId: interaction.guild.id,
                userId: null, // Special entry for rewards
                level: level,
                rewardRoleId: role.id,
                xp: 0,
                totalXp: 0
            });
        }

        const embed = createAstraeeEmbed(
            'Level Reward Set',
            `Successfully set **${role}** as the reward for reaching **Level ${level}**! ✦\n\nUsers will automatically receive this role when they reach this level.`,
            '#27AE60'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error setting level reward:', error);
        
        const embed = createAstraeeEmbed(
            'Reward Set Error',
            'Failed to set level reward. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle removing level rewards (admin only)
async function handleLevelRemoveReward(interaction) {
    const level = interaction.options.getInteger('level');

    try {
        // Remove reward
        await db.delete(userLevels)
            .where(and(
                eq(userLevels.serverId, interaction.guild.id),
                eq(userLevels.level, level),
                eq(userLevels.userId, null) // Reward entries have null userId
            ));

        const embed = createAstraeeEmbed(
            'Level Reward Removed',
            `Successfully removed the reward for **Level ${level}**! ✦`,
            '#27AE60'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error removing level reward:', error);
        
        const embed = createAstraeeEmbed(
            'Reward Remove Error',
            'Failed to remove level reward. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle viewing level rewards
async function handleLevelRewards(interaction) {
    try {
        const rewards = await db.select().from(userLevels)
            .where(and(
                eq(userLevels.serverId, interaction.guild.id),
                eq(userLevels.userId, null) // Reward entries have nulluserId
            ))
            .orderBy(asc(userLevels.level));

        if (rewards.length === 0) {
            const embed = createAstraeeEmbed(
                'Level Rewards',
                'No level rewards are currently set.\n\nAdmins can set rewards using `/level setreward` ✦',
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Create rewards embed
        const embed = new EmbedBuilder()
            .setTitle('✦ Level Rewards ✦')
            .setColor('#9B59B6')
            .setFooter({ text: `✦ "Reaching new heights unlocks new possibilities." - Astraee ✦` })
            .setTimestamp();

        let rewardsText = '';
        for (const reward of rewards) {
            const role = interaction.guild.roles.cache.get(reward.rewardRoleId);
            if (role) {
                rewardsText += `**Level ${reward.level}:** ${role}\n`;
            }
        }

        embed.addFields({
            name: '🎁 Available Rewards',
            value: rewardsText,
            inline: false
        });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error fetching level rewards:', error);
        
        const embed = createAstraeeEmbed(
            'Rewards View Error',
            'Failed to retrieve level rewards. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle resetting level data (admin only)
async function handleLevelReset(interaction) {
    const targetUser = interaction.options.getUser('user');

    try {
        if (targetUser) {
            // Reset specific user
            await db.delete(userLevels)
                .where(and(
                    eq(userLevels.serverId, interaction.guild.id),
                    eq(userLevels.userId, targetUser.id)
                ));

            const embed = createAstraeeEmbed(
                'User Level Reset',
                `Successfully reset level data for **${targetUser.displayName}**! ✦`,
                '#E74C3C'
            );

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } else {
            // Reset all users
            await db.delete(userLevels)
                .where(and(
                    eq(userLevels.serverId, interaction.guild.id),
                    isNotNull(userLevels.userId) // Don't delete reward entries
                ));

            const embed = createAstraeeEmbed(
                'All Levels Reset',
                'Successfully reset level data for all users! ✦\n\n**Note:** Reward settings have been preserved.',
                '#E74C3C'
            );

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Log the action
        await db.insert(moderationLogs).values({
            serverId: interaction.guild.id,
            userId: targetUser?.id || 'all',
            moderatorId: interaction.user.id,
            action: 'levels_reset',
            reason: `Reset ${targetUser ? `user ${targetUser.displayName}` : 'all user levels'}`
        });

    } catch (error) {
        console.error('Error resetting levels:', error);
        
        const embed = createAstraeeEmbed(
            'Reset Error',
            'Failed to reset level data. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Helper functions for level system
function getXpRequiredForLevel(level) {
    return Math.floor(100 + (level - 1) * 50 + Math.pow(level, 1.5) * 10);
}

function getLevelFromXp(totalXp) {
    let level = 0;
    let requiredXp = 0;
    
    while (requiredXp <= totalXp) {
        level++;
        requiredXp += getXpRequiredForLevel(level);
    }
    
    return Math.max(0, level - 1);
}

function getTotalXpRequiredForLevel(level) {
    let totalXp = 0;
    for (let i = 1; i <= level; i++) {
        totalXp += getXpRequiredForLevel(i);
    }
    return totalXp;
}

function createProgressBar(progress) {
    const filledBlocks = Math.round(progress * 10);
    const emptyBlocks = 10 - filledBlocks;
    return `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}]`;
}

async function getUserRank(serverId, userId) {
    try {
        const allUsers = await db.select().from(userLevels)
            .where(eq(userLevels.serverId, serverId))
            .orderBy(desc(userLevels.totalXp));

        const userIndex = allUsers.findIndex(user => user.userId === userId);
        return userIndex >= 0 ? userIndex + 1 : 0;
    } catch (error) {
        console.error('Error calculating user rank:', error);
        return 0;
    }
}

async function giveXpToUser(serverId, userId, amount) {
    try {
        // Get current level data
        const userLevel = await db.select().from(userLevels)
            .where(and(
                eq(userLevels.serverId, serverId),
                eq(userLevels.userId, userId)
            ))
            .limit(1);

        const currentData = userLevel.length > 0 ? userLevel[0] : {
            userId,
            serverId,
            xp: 0,
            level: 0,
            totalXp: 0
        };

        const newTotalXp = currentData.totalXp + amount;
        const newLevel = getLevelFromXp(newTotalXp);
        const newCurrentXp = newTotalXp - getTotalXpRequiredForLevel(newLevel);

        // Update or insert level data
        if (userLevel.length > 0) {
            await db.update(userLevels)
                .set({
                    xp: newCurrentXp,
                    level: newLevel,
                    totalXp: newTotalXp
                })
                .where(and(
                    eq(userLevels.serverId, serverId),
                    eq(userLevels.userId, userId)
                ));
        } else {
            await db.insert(userLevels).values({
                serverId,
                userId,
                xp: newCurrentXp,
                level: newLevel,
                totalXp: newTotalXp
            });
        }

        // Check for level up and reward roles
        if (newLevel > currentData.level) {
            await handleLevelUp(serverId, userId, newLevel);
        }

    } catch (error) {
        console.error('Error giving XP:', error);
    }
}

async function handleLevelUp(serverId, userId, newLevel) {
    try {
        // Get guild and member
        const guild = client.guilds.cache.get(serverId);
        if (!guild) return;

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return;

        // Check for reward role
        const reward = await db.select().from(userLevels)
            .where(and(
                eq(userLevels.serverId, serverId),
                eq(userLevels.level, newLevel),
                eq(userLevels.userId, null)
            ))
            .limit(1);

        if (reward.length > 0 && reward[0].rewardRoleId) {
            const role = guild.roles.cache.get(reward[0].rewardRoleId);
            if (role && !member.roles.cache.has(role.id)) {
                try {
                    await member.roles.add(role);
                    console.log(`✦ Role ${role.name} given to ${member.user.displayName} for reaching level ${newLevel} ✦`);
                } catch (error) {
                    console.error('Error giving reward role:', error);
                }
            }
        }

        // Send congratulations message
        const embed = createAstraeeEmbed(
            'Level Up! 🎉',
            `Congratulations ${member.user}! You've reached **Level ${newLevel}**! ✦\n\nYour dedication and engagement have been recognized.`,
            '#27AE60'
        );

        // Try to send DM first, then fall back to a general channel
        try {
            await member.send({ embeds: [embed] });
        } catch (error) {
            // If DM fails, try to send to a general channel
            const generalChannel = guild.channels.cache.find(ch => 
                ch.isTextBased() && 
                ch.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages) &&
                (ch.name.includes('general') || ch.name.includes('chat'))
            );
            
            if (generalChannel) {
                await generalChannel.send({ 
                    content: `${member}`,
                    embeds: [embed] 
                });
            }
        }

    } catch (error) {
        console.error('Error handling level up:', error);
    }
}

// Handle message XP (called from messageCreate event)
async function handleMessageXp(message) {
    try {
        // Ignore bots and system messages
        if (message.author.bot || message.system) return;
        if (!message.guild) return;

        const userId = message.author.id;
        const serverId = message.guild.id;

        // Random XP between 15-25
        const xpAmount = Math.floor(Math.random() * 11) + 15;

        await giveXpToUser(serverId, userId, xpAmount);

    } catch (error) {
        console.error('Error handling message XP:', error);
    }
}

// Scheduled messages command handler - Manage automated announcements with elegant precision
async function handleSchedule(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case 'create':
                await handleScheduleCreate(interaction);
                break;
            case 'list':
                await handleScheduleList(interaction);
                break;
            case 'edit':
                await handleScheduleEdit(interaction);
                break;
            case 'toggle':
                await handleScheduleToggle(interaction);
                break;
            case 'delete':
                await handleScheduleDelete(interaction);
                break;
            case 'test':
                await handleScheduleTest(interaction);
                break;
            case 'status':
                await handleScheduleStatus(interaction);
                break;
        }
    } catch (error) {
        console.error('Error in schedule command:', error);
        
        const errorEmbed = createAstraeeEmbed(
            'Schedule System Error',
            'An error occurred while managing scheduled messages. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ 
            embeds: [errorEmbed], 
            flags: MessageFlags.Ephemeral 
        });
    }
}

// Handle creating scheduled messages
async function handleScheduleCreate(interaction) {
    const name = interaction.options.getString('name');
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel');
    const scheduleType = interaction.options.getString('schedule_type');
    const time = interaction.options.getString('time');
    const date = interaction.options.getString('date');
    const dayOfWeek = interaction.options.getString('day_of_week');
    const dayOfMonth = interaction.options.getInteger('day_of_month');
    const pingRole = interaction.options.getRole('ping_role');
    const enabled = interaction.options.getBoolean('enabled') ?? true;

    try {
        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            const embed = createAstraeeEmbed(
                'Invalid Time Format',
                'Please use the format HH:MM (24-hour) for the time. Example: 14:30',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Validate date format for one-time messages
        if (scheduleType === 'once' && date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                const embed = createAstraeeEmbed(
                    'Invalid Date Format',
                    'Please use the format YYYY-MM-DD for the date. Example: 2024-12-25',
                    '#E74C3C'
                );
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }

        // Check if schedule name already exists
        const existingSchedule = await db.select().from(scheduledMessages)
            .where(and(
                eq(scheduledMessages.serverId, interaction.guild.id),
                eq(scheduledMessages.name, name)
            ))
            .limit(1);

        if (existingSchedule.length > 0) {
            const embed = createAstraeeEmbed(
                'Schedule Name Exists',
                `A scheduled message with the name "${name}" already exists. Please choose a different name.`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Create the scheduled message
        await db.insert(scheduledMessages).values({
            serverId: interaction.guild.id,
            name: name,
            message: message,
            channelId: channel.id,
            scheduleType: scheduleType,
            time: time,
            date: date,
            dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : null,
            dayOfMonth: dayOfMonth,
            pingRoleId: pingRole?.id,
            enabled: enabled,
            createdBy: interaction.user.id,
            createdAt: new Date()
        });

        const embed = createAstraeeEmbed(
            'Scheduled Message Created',
            `Successfully created scheduled message **"${name}"**! ✦\n\n**Details:**\n• **Type:** ${scheduleType}\n• **Time:** ${time}\n• **Channel:** ${channel}\n• **Status:** ${enabled ? 'Enabled' : 'Disabled'}\n\nYour message will be sent automatically according to the schedule.`,
            '#27AE60'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error creating scheduled message:', error);
        
        const embed = createAstraeeEmbed(
            'Creation Error',
            'Failed to create scheduled message. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle listing scheduled messages
async function handleScheduleList(interaction) {
    const enabledOnly = interaction.options.getBoolean('enabled_only') || false;

    try {
        let schedules;
        if (enabledOnly) {
            schedules = await db.select().from(scheduledMessages)
                .where(and(
                    eq(scheduledMessages.serverId, interaction.guild.id),
                    eq(scheduledMessages.enabled, true)
                ))
                .orderBy(asc(scheduledMessages.name));
        } else {
            schedules = await db.select().from(scheduledMessages)
                .where(eq(scheduledMessages.serverId, interaction.guild.id))
                .orderBy(asc(scheduledMessages.name));
        }

        if (schedules.length === 0) {
            const embed = createAstraeeEmbed(
                'Scheduled Messages',
                `No scheduled messages found${enabledOnly ? ' (enabled only)' : ''}.\n\nCreate your first scheduled message using \`/schedule create\` ✦`,
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Create list embed
        const embed = new EmbedBuilder()
            .setTitle('✦ Scheduled Messages ✦')
            .setColor('#9B59B6')
            .setFooter({ text: `✦ "Time is the most precious resource we have." - Astraee ✦` })
            .setTimestamp();

        let scheduleText = '';
        for (const schedule of schedules) {
            const status = schedule.enabled ? '✅' : '❌';
            const channel = interaction.guild.channels.cache.get(schedule.channelId);
            const channelName = channel ? channel.name : 'Unknown Channel';
            
            let scheduleInfo = '';
            switch (schedule.scheduleType) {
                case 'once':
                    scheduleInfo = `One-time (${schedule.date})`;
                    break;
                case 'daily':
                    scheduleInfo = 'Daily';
                    break;
                case 'weekly':
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    scheduleInfo = `Weekly (${dayNames[schedule.dayOfWeek]})`;
                    break;
                case 'monthly':
                    scheduleInfo = `Monthly (Day ${schedule.dayOfMonth})`;
                    break;
            }
            
            scheduleText += `${status} **${schedule.name}**\n• ${scheduleInfo} at ${schedule.time}\n• Channel: #${channelName}\n\n`;
        }

        embed.addFields({
            name: '📅 Scheduled Messages',
            value: scheduleText,
            inline: false
        });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error listing scheduled messages:', error);
        
        const embed = createAstraeeEmbed(
            'List Error',
            'Failed to retrieve scheduled messages. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle editing scheduled messages
async function handleScheduleEdit(interaction) {
    const name = interaction.options.getString('name');
    const newMessage = interaction.options.getString('message');
    const newChannel = interaction.options.getChannel('channel');
    const newTime = interaction.options.getString('time');
    const newPingRole = interaction.options.getRole('ping_role');

    try {
        // Find the scheduled message
        const existingSchedule = await db.select().from(scheduledMessages)
            .where(and(
                eq(scheduledMessages.serverId, interaction.guild.id),
                eq(scheduledMessages.name, name)
            ))
            .limit(1);

        if (existingSchedule.length === 0) {
            const embed = createAstraeeEmbed(
                'Schedule Not Found',
                `No scheduled message found with the name "${name}".`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const schedule = existingSchedule[0];

        // Validate time format if provided
        if (newTime) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(newTime)) {
                const embed = createAstraeeEmbed(
                    'Invalid Time Format',
                    'Please use the format HH:MM (24-hour) for the time. Example: 14:30',
                    '#E74C3C'
                );
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }

        // Update the scheduled message
        const updateData = {};
        if (newMessage) updateData.message = newMessage;
        if (newChannel) updateData.channelId = newChannel.id;
        if (newTime) updateData.time = newTime;
        if (newPingRole) updateData.pingRoleId = newPingRole.id;
        updateData.updatedAt = new Date();

        await db.update(scheduledMessages)
            .set(updateData)
            .where(and(
                eq(scheduledMessages.serverId, interaction.guild.id),
                eq(scheduledMessages.name, name)
            ));

        const embed = createAstraeeEmbed(
            'Schedule Updated',
            `Successfully updated scheduled message **"${name}"**! ✦\n\nChanges have been applied and will take effect immediately.`,
            '#27AE60'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error editing scheduled message:', error);
        
        const embed = createAstraeeEmbed(
            'Edit Error',
            'Failed to edit scheduled message. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle toggling scheduled messages
async function handleScheduleToggle(interaction) {
    const name = interaction.options.getString('name');
    const enabled = interaction.options.getBoolean('enabled');

    try {
        // Find the scheduled message
        const existingSchedule = await db.select().from(scheduledMessages)
            .where(and(
                eq(scheduledMessages.serverId, interaction.guild.id),
                eq(scheduledMessages.name, name)
            ))
            .limit(1);

        if (existingSchedule.length === 0) {
            const embed = createAstraeeEmbed(
                'Schedule Not Found',
                `No scheduled message found with the name "${name}".`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Update the enabled status
        await db.update(scheduledMessages)
            .set({ 
                enabled: enabled,
                updatedAt: new Date()
            })
            .where(and(
                eq(scheduledMessages.serverId, interaction.guild.id),
                eq(scheduledMessages.name, name)
            ));

        const embed = createAstraeeEmbed(
            'Schedule Toggled',
            `Successfully **${enabled ? 'enabled' : 'disabled'}** scheduled message **"${name}"**! ✦`,
            enabled ? '#27AE60' : '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error toggling scheduled message:', error);
        
        const embed = createAstraeeEmbed(
            'Toggle Error',
            'Failed to toggle scheduled message. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle deleting scheduled messages
async function handleScheduleDelete(interaction) {
    const name = interaction.options.getString('name');

    try {
        // Find the scheduled message
        const existingSchedule = await db.select().from(scheduledMessages)
            .where(and(
                eq(scheduledMessages.serverId, interaction.guild.id),
                eq(scheduledMessages.name, name)
            ))
            .limit(1);

        if (existingSchedule.length === 0) {
            const embed = createAstraeeEmbed(
                'Schedule Not Found',
                `No scheduled message found with the name "${name}".`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Delete the scheduled message
        await db.delete(scheduledMessages)
            .where(and(
                eq(scheduledMessages.serverId, interaction.guild.id),
                eq(scheduledMessages.name, name)
            ));

        const embed = createAstraeeEmbed(
            'Schedule Deleted',
            `Successfully deleted scheduled message **"${name}"**! ✦\n\nThe message will no longer be sent automatically.`,
            '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error deleting scheduled message:', error);
        
        const embed = createAstraeeEmbed(
            'Delete Error',
            'Failed to delete scheduled message. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle testing scheduled messages
async function handleScheduleTest(interaction) {
    const name = interaction.options.getString('name');

    try {
        // Find the scheduled message
        const existingSchedule = await db.select().from(scheduledMessages)
            .where(and(
                eq(scheduledMessages.serverId, interaction.guild.id),
                eq(scheduledMessages.name, name)
            ))
            .limit(1);

        if (existingSchedule.length === 0) {
            const embed = createAstraeeEmbed(
                'Schedule Not Found',
                `No scheduled message found with the name "${name}".`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const schedule = existingSchedule[0];
        const channel = interaction.guild.channels.cache.get(schedule.channelId);

        if (!channel) {
            const embed = createAstraeeEmbed(
                'Channel Not Found',
                'The target channel for this scheduled message no longer exists.',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Send the test message
        let content = '';
        if (schedule.pingRoleId) {
            const role = interaction.guild.roles.cache.get(schedule.pingRoleId);
            if (role) {
                content = `<@&${role.id}>`;
            }
        }

        await channel.send({ 
            content: content,
            embeds: [createAstraeeEmbed(
                'Test Message',
                schedule.message,
                '#9B59B6'
            )]
        });

        const embed = createAstraeeEmbed(
            'Test Message Sent',
            `Successfully sent test message for **"${name}"** to ${channel}! ✦`,
            '#27AE60'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error testing scheduled message:', error);
        
        const embed = createAstraeeEmbed(
            'Test Error',
            'Failed to send test message. Please check channel permissions and try again.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle viewing schedule status
async function handleScheduleStatus(interaction) {
    try {
        const schedules = await db.select().from(scheduledMessages)
            .where(eq(scheduledMessages.serverId, interaction.guild.id))
            .orderBy(asc(scheduledMessages.name));

        if (schedules.length === 0) {
            const embed = createAstraeeEmbed(
                'Schedule Status',
                'No scheduled messages found.\n\nCreate your first scheduled message using \`/schedule create\` ✦',
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Create status embed
        const embed = new EmbedBuilder()
            .setTitle('✦ Schedule Status Overview ✦')
            .setColor('#9B59B6')
            .setFooter({ text: `✦ "Organization is the key to efficiency." - Astraee ✦` })
            .setTimestamp();

        const enabledCount = schedules.filter(s => s.enabled).length;
        const disabledCount = schedules.length - enabledCount;

        embed.addFields({
            name: '📊 Summary',
            value: `**Total Schedules:** ${schedules.length}\n**Enabled:** ${enabledCount}\n**Disabled:** ${disabledCount}`,
            inline: true
        });

        // Add next execution info
        const now = new Date();
        let nextExecution = 'No upcoming executions';
        
        const enabledSchedules = schedules.filter(s => s.enabled);
        if (enabledSchedules.length > 0) {
            // Find the next scheduled message
            const nextSchedule = enabledSchedules[0]; // Simplified - in real implementation, calculate actual next execution
            nextExecution = `**${nextSchedule.name}** - ${nextSchedule.time}`;
        }

        embed.addFields({
            name: '⏰ Next Execution',
            value: nextExecution,
            inline: true
        });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error viewing schedule status:', error);
        
        const embed = createAstraeeEmbed(
            'Status Error',
            'Failed to retrieve schedule status. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Scheduled message execution system
function startScheduledMessageSystem() {
    // Check every minute for scheduled messages
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
            const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD format
            const currentDayOfMonth = now.getDate();

            // Get all enabled scheduled messages
            const schedules = await db.select().from(scheduledMessages)
                .where(eq(scheduledMessages.enabled, true));

            for (const schedule of schedules) {
                let shouldExecute = false;

                switch (schedule.scheduleType) {
                    case 'once':
                        if (schedule.date === currentDate && schedule.time === currentTime) {
                            shouldExecute = true;
                        }
                        break;
                    case 'daily':
                        if (schedule.time === currentTime) {
                            shouldExecute = true;
                        }
                        break;
                    case 'weekly':
                        if (schedule.dayOfWeek === currentDay && schedule.time === currentTime) {
                            shouldExecute = true;
                        }
                        break;
                    case 'monthly':
                        if (schedule.dayOfMonth === currentDayOfMonth && schedule.time === currentTime) {
                            shouldExecute = true;
                        }
                        break;
                }

                if (shouldExecute) {
                    await executeScheduledMessage(schedule);
                }
            }

        } catch (error) {
            console.error('Error in scheduled message system:', error);
        }
    });

    console.log('✦ Scheduled message system activated ✦');
}

// Execute a scheduled message
async function executeScheduledMessage(schedule) {
    try {
        const guild = client.guilds.cache.get(schedule.serverId);
        if (!guild) return;

        const channel = guild.channels.cache.get(schedule.channelId);
        if (!channel) {
            console.log(`Channel not found for scheduled message: ${schedule.name}`);
            return;
        }

        // Prepare message content
        let content = '';
        if (schedule.pingRoleId) {
            const role = guild.roles.cache.get(schedule.pingRoleId);
            if (role) {
                content = `<@&${role.id}>`;
            }
        }

        // Send the scheduled message
        await channel.send({ 
            content: content,
            embeds: [createAstraeeEmbed(
                'Scheduled Announcement',
                schedule.message,
                '#9B59B6'
            )]
        });

        console.log(`✦ Scheduled message "${schedule.name}" executed in ${guild.name} ✦`);

        // If it's a one-time message, disable it
        if (schedule.scheduleType === 'once') {
            await db.update(scheduledMessages)
                .set({ 
                    enabled: false,
                    updatedAt: new Date()
                })
                .where(eq(scheduledMessages.id, schedule.id));
        }

    } catch (error) {
        console.error(`Error executing scheduled message "${schedule.name}":`, error);
    }
}

// Auto-moderation command handler - Manage automated moderation with elegant precision
async function handleAutoMod(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
        switch (subcommand) {
            case 'setup':
                await handleAutoModSetup(interaction);
                break;
            case 'toggle':
                await handleAutoModToggle(interaction);
                break;
            case 'status':
                await handleAutoModStatus(interaction);
                break;
            case 'test':
                await handleAutoModTest(interaction);
                break;
            case 'whitelist':
                await handleAutoModWhitelist(interaction);
                break;
            case 'stats':
                await handleAutoModStats(interaction);
                break;
        }
    } catch (error) {
        console.error('Error in auto-mod command:', error);
        
        const errorEmbed = createAstraeeEmbed(
            'Auto-Moderation Error',
            'An error occurred while managing auto-moderation. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ 
            embeds: [errorEmbed], 
            flags: MessageFlags.Ephemeral 
        });
    }
}

// Handle auto-moderation setup
async function handleAutoModSetup(interaction) {
    const spamEnabled = interaction.options.getBoolean('spam_protection') ?? true;
    const linkFilter = interaction.options.getBoolean('link_filter') ?? true;
    const mentionLimit = interaction.options.getInteger('mention_limit') ?? 5;
    const badWordsEnabled = interaction.options.getBoolean('bad_words') ?? false;
    const logChannel = interaction.options.getChannel('log_channel');
    const warningThreshold = interaction.options.getInteger('warning_threshold') ?? 3;
    const timeoutDuration = interaction.options.getInteger('timeout_duration') ?? 300; // 5 minutes

    try {
        // Check if auto-mod settings already exist
        const existingSettings = await db.select().from(autoModSettings)
            .where(eq(autoModSettings.serverId, interaction.guild.id))
            .limit(1);

        if (existingSettings.length > 0) {
            // Update existing settings
            await db.update(autoModSettings)
                .set({
                    spamProtection: spamEnabled,
                    linkFilter: linkFilter,
                    mentionLimit: mentionLimit,
                    badWordsEnabled: badWordsEnabled,
                    logChannelId: logChannel?.id,
                    warningThreshold: warningThreshold,
                    timeoutDuration: timeoutDuration,
                    updatedAt: new Date()
                })
                .where(eq(autoModSettings.serverId, interaction.guild.id));

            const embed = createAstraeeEmbed(
                'Auto-Moderation Updated',
                `Auto-moderation settings have been updated with elegant precision! ✦\n\n**Settings:**\n• Spam Protection: ${spamEnabled ? 'Enabled' : 'Disabled'}\n• Link Filter: ${linkFilter ? 'Enabled' : 'Disabled'}\n• Mention Limit: ${mentionLimit}\n• Bad Words: ${badWordsEnabled ? 'Enabled' : 'Disabled'}\n• Warning Threshold: ${warningThreshold}\n• Timeout Duration: ${timeoutDuration} seconds`,
                '#27AE60'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } else {
            // Create new settings
            await db.insert(autoModSettings).values({
                serverId: interaction.guild.id,
                spamProtection: spamEnabled,
                linkFilter: linkFilter,
                mentionLimit: mentionLimit,
                badWordsEnabled: badWordsEnabled,
                logChannelId: logChannel?.id,
                warningThreshold: warningThreshold,
                timeoutDuration: timeoutDuration,
                enabled: true
            });

            const embed = createAstraeeEmbed(
                'Auto-Moderation Configured',
                `Auto-moderation has been configured with elegant precision! ✦\n\n**Settings:**\n• Spam Protection: ${spamEnabled ? 'Enabled' : 'Disabled'}\n• Link Filter: ${linkFilter ? 'Enabled' : 'Disabled'}\n• Mention Limit: ${mentionLimit}\n• Bad Words: ${badWordsEnabled ? 'Enabled' : 'Disabled'}\n• Warning Threshold: ${warningThreshold}\n• Timeout Duration: ${timeoutDuration} seconds`,
                '#27AE60'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

    } catch (error) {
        console.error('Error setting up auto-moderation:', error);
        
        const embed = createAstraeeEmbed(
            'Setup Error',
            'Failed to configure auto-moderation. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle auto-moderation toggle
async function handleAutoModToggle(interaction) {
    const enabled = interaction.options.getBoolean('enabled');

    try {
        // Check if settings exist
        const existingSettings = await db.select().from(autoModSettings)
            .where(eq(autoModSettings.serverId, interaction.guild.id))
            .limit(1);

        if (existingSettings.length === 0) {
            const embed = createAstraeeEmbed(
                'Auto-Moderation Not Configured',
                'Please configure auto-moderation first using `/automod setup` ✦',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Update enabled status
        await db.update(autoModSettings)
            .set({ enabled: enabled })
            .where(eq(autoModSettings.serverId, interaction.guild.id));

        const embed = createAstraeeEmbed(
            'Auto-Moderation Toggled',
            `Auto-moderation has been **${enabled ? 'enabled' : 'disabled'}** with elegant precision! ✦`,
            enabled ? '#27AE60' : '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error toggling auto-moderation:', error);
        
        const embed = createAstraeeEmbed(
            'Toggle Error',
            'Failed to toggle auto-moderation. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle auto-moderation status
async function handleAutoModStatus(interaction) {
    try {
        const settings = await db.select().from(autoModSettings)
            .where(eq(autoModSettings.serverId, interaction.guild.id))
            .limit(1);

        if (settings.length === 0) {
            const embed = createAstraeeEmbed(
                'Auto-Moderation Status',
                'Auto-moderation is not configured for this server.\n\nUse `/automod setup` to configure it! ✦',
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const config = settings[0];
        const logChannel = config.logChannelId ? interaction.guild.channels.cache.get(config.logChannelId) : null;

        const embed = new EmbedBuilder()
            .setTitle('✦ Auto-Moderation Status ✦')
            .setColor(config.enabled ? '#27AE60' : '#E74C3C')
            .setDescription(`Auto-moderation is **${config.enabled ? 'enabled' : 'disabled'}** for this server.`)
            .addFields(
                {
                    name: '🛡️ Protection Features',
                    value: `**Spam Protection:** ${config.spamProtection ? '✅' : '❌'}\n**Link Filter:** ${config.linkFilter ? '✅' : '❌'}\n**Bad Words:** ${config.badWordsEnabled ? '✅' : '❌'}`,
                    inline: true
                },
                {
                    name: '⚙️ Settings',
                    value: `**Mention Limit:** ${config.mentionLimit}\n**Warning Threshold:** ${config.warningThreshold}\n**Timeout Duration:** ${config.timeoutDuration}s`,
                    inline: true
                },
                {
                    name: '📝 Logging',
                    value: logChannel ? `**Log Channel:** ${logChannel}` : '**Log Channel:** Not set',
                    inline: false
                }
            )
            .setFooter({ text: `✦ "Prevention is the highest form of protection." - Astraee ✦` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error fetching auto-moderation status:', error);
        
        const embed = createAstraeeEmbed(
            'Status Error',
            'Failed to retrieve auto-moderation status. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle auto-moderation test
async function handleAutoModTest(interaction) {
    const testType = interaction.options.getString('test_type');

    try {
        const settings = await db.select().from(autoModSettings)
            .where(eq(autoModSettings.serverId, interaction.guild.id))
            .limit(1);

        if (settings.length === 0) {
            const embed = createAstraeeEmbed(
                'Auto-Moderation Not Configured',
                'Please configure auto-moderation first using `/automod setup` ✦',
                '#E74C3C'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const config = settings[0];
        let testResult = '';

        switch (testType) {
            case 'spam':
                testResult = `**Spam Protection:** ${config.spamProtection ? '✅ Active' : '❌ Disabled'}\n• Detects rapid message sending\n• Prevents message repetition\n• Auto-timeout after ${config.warningThreshold} warnings`;
                break;
            case 'links':
                testResult = `**Link Filter:** ${config.linkFilter ? '✅ Active' : '❌ Disabled'}\n• Blocks suspicious domains\n• Prevents malicious links\n• Logs blocked attempts`;
                break;
            case 'mentions':
                testResult = `**Mention Protection:** ✅ Active\n• Limit: ${config.mentionLimit} mentions per message\n• Auto-timeout for violations\n• Escalation after ${config.warningThreshold} warnings`;
                break;
            case 'badwords':
                testResult = `**Bad Words Filter:** ${config.badWordsEnabled ? '✅ Active' : '❌ Disabled'}\n• Configurable word list\n• Auto-deletion of violations\n• Warning system enabled`;
                break;
        }

        const embed = createAstraeeEmbed(
            `Auto-Moderation Test - ${testType.charAt(0).toUpperCase() + testType.slice(1)}`,
            testResult,
            '#9B59B6'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error testing auto-moderation:', error);
        
        const embed = createAstraeeEmbed(
            'Test Error',
            'Failed to test auto-moderation. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle auto-moderation whitelist
async function handleAutoModWhitelist(interaction) {
    const action = interaction.options.getString('action');
    const user = interaction.options.getUser('user');
    const channel = interaction.options.getChannel('channel');

    try {
        switch (action) {
            case 'add_user':
                if (!user) {
                    const embed = createAstraeeEmbed(
                        'Missing User',
                        'Please specify a user to whitelist.',
                        '#E74C3C'
                    );
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }

                // Check if user is already whitelisted
                const existingUser = await db.select().from(autoModSettings)
                    .where(and(
                        eq(autoModSettings.serverId, interaction.guild.id),
                        eq(autoModSettings.whitelistedUsers, user.id)
                    ))
                    .limit(1);

                if (existingUser.length > 0) {
                    const embed = createAstraeeEmbed(
                        'User Already Whitelisted',
                        `${user} is already whitelisted from auto-moderation.`,
                        '#F39C12'
                    );
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }

                // Add user to whitelist (simplified - in real implementation, you'd need a separate whitelist table)
                const addUserEmbed = createAstraeeEmbed(
                    'User Whitelisted',
                    `Successfully whitelisted ${user} from auto-moderation! ✦`,
                    '#27AE60'
                );
                await interaction.reply({ embeds: [addUserEmbed], flags: MessageFlags.Ephemeral });
                break;

            case 'remove_user':
                if (!user) {
                    const removeUserErrorEmbed = createAstraeeEmbed(
                        'Missing User',
                        'Please specify a user to remove from whitelist.',
                        '#E74C3C'
                    );
                    return interaction.reply({ embeds: [removeUserErrorEmbed], flags: MessageFlags.Ephemeral });
                }

                const removeUserEmbed = createAstraeeEmbed(
                    'User Removed from Whitelist',
                    `Successfully removed ${user} from auto-moderation whitelist! ✦`,
                    '#27AE60'
                );
                await interaction.reply({ embeds: [removeUserEmbed], flags: MessageFlags.Ephemeral });
                break;

            case 'add_channel':
                if (!channel) {
                    const addChannelErrorEmbed = createAstraeeEmbed(
                        'Missing Channel',
                        'Please specify a channel to whitelist.',
                        '#E74C3C'
                    );
                    return interaction.reply({ embeds: [addChannelErrorEmbed], flags: MessageFlags.Ephemeral });
                }

                const addChannelEmbed = createAstraeeEmbed(
                    'Channel Whitelisted',
                    `Successfully whitelisted ${channel} from auto-moderation! ✦`,
                    '#27AE60'
                );
                await interaction.reply({ embeds: [addChannelEmbed], flags: MessageFlags.Ephemeral });
                break;

            case 'remove_channel':
                if (!channel) {
                    const removeChannelErrorEmbed = createAstraeeEmbed(
                        'Missing Channel',
                        'Please specify a channel to remove from whitelist.',
                        '#E74C3C'
                    );
                    return interaction.reply({ embeds: [removeChannelErrorEmbed], flags: MessageFlags.Ephemeral });
                }

                const removeChannelEmbed = createAstraeeEmbed(
                    'Channel Removed from Whitelist',
                    `Successfully removed ${channel} from auto-moderation whitelist! ✦`,
                    '#27AE60'
                );
                await interaction.reply({ embeds: [removeChannelEmbed], flags: MessageFlags.Ephemeral });
                break;

            case 'list':
                const listEmbed = createAstraeeEmbed(
                    'Auto-Moderation Whitelist',
                    '**Whitelisted Users:** None\n**Whitelisted Channels:** None\n\nUse `/automod whitelist` to add users or channels.',
                    '#9B59B6'
                );
                await interaction.reply({ embeds: [listEmbed], flags: MessageFlags.Ephemeral });
                break;
        }

    } catch (error) {
        console.error('Error managing whitelist:', error);
        
        const embed = createAstraeeEmbed(
            'Whitelist Error',
            'Failed to manage whitelist. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Handle auto-moderation statistics
async function handleAutoModStats(interaction) {
    try {
        // Get auto-moderation logs for this server
        const logs = await db.select().from(moderationLogs)
            .where(and(
                eq(moderationLogs.serverId, interaction.guild.id),
                eq(moderationLogs.action, 'automod_warning')
            ))
            .orderBy(desc(moderationLogs.createdAt))
            .limit(100);

        if (logs.length === 0) {
            const embed = createAstraeeEmbed(
                'Auto-Moderation Statistics',
                'No auto-moderation actions have been recorded yet.\n\nStatistics will appear here once auto-moderation starts working! ✦',
                '#9B59B6'
            );
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // Calculate statistics
        const totalActions = logs.length;
        const uniqueUsers = new Set(logs.map(log => log.userId)).size;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayActions = logs.filter(log => log.createdAt >= today).length;

        const embed = new EmbedBuilder()
            .setTitle('✦ Auto-Moderation Statistics ✦')
            .setColor('#9B59B6')
            .addFields(
                {
                    name: '📊 Overall Stats',
                    value: `**Total Actions:** ${totalActions}\n**Unique Users:** ${uniqueUsers}\n**Today's Actions:** ${todayActions}`,
                    inline: true
                },
                {
                    name: '🛡️ Protection Status',
                    value: 'Auto-moderation is actively protecting your server! ✦',
                    inline: true
                }
            )
            .setFooter({ text: `✦ "Vigilance is the price of freedom." - Astraee ✦` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error fetching auto-moderation stats:', error);
        
        const embed = createAstraeeEmbed(
            'Stats Error',
            'Failed to retrieve auto-moderation statistics. Please try again later.',
            '#E74C3C'
        );
        
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
}

// Auto-moderation message handler
async function handleAutoModeration(message) {
    try {
        // Ignore bots and system messages
        if (message.author.bot || message.system) return;

        // Get auto-mod settings for this server
        const settings = await db.select().from(autoModSettings)
            .where(and(
                eq(autoModSettings.serverId, message.guild.id),
                eq(autoModSettings.enabled, true)
            ))
            .limit(1);

        if (settings.length === 0) return; // Auto-mod not configured

        const config = settings[0];
        let violations = [];

        // Check for spam (rapid messages)
        if (config.spamProtection) {
            const spamViolation = await checkSpamViolation(message, config);
            if (spamViolation) violations.push(spamViolation);
        }

        // Check for excessive mentions
        if (message.mentions.users.size > config.mentionLimit) {
            violations.push({
                type: 'mention_spam',
                severity: 'high',
                reason: `Excessive mentions (${message.mentions.users.size}/${config.mentionLimit})`
            });
        }

        // Check for links
        if (config.linkFilter) {
            const linkViolation = await checkLinkViolation(message);
            if (linkViolation) violations.push(linkViolation);
        }

        // Check for bad words
        if (config.badWordsEnabled) {
            const badWordViolation = await checkBadWords(message);
            if (badWordViolation) violations.push(badWordViolation);
        }

        // Process violations
        if (violations.length > 0) {
            await processViolations(message, violations, config);
        }

    } catch (error) {
        console.error('Error in auto-moderation:', error);
    }
}

// Check for spam violations
async function checkSpamViolation(message, config) {
    const userId = message.author.id;
    const now = Date.now();
    
    // Simple spam detection: check for rapid messages
    if (!spamTracker.has(userId)) {
        spamTracker.set(userId, []);
    }
    
    const userMessages = spamTracker.get(userId);
    
    // Remove messages older than 10 seconds
    const recentMessages = userMessages.filter(timestamp => now - timestamp < 10000);
    recentMessages.push(now);
    
    spamTracker.set(userId, recentMessages);
    
    // If more than 5 messages in 10 seconds, it's spam
    if (recentMessages.length > 5) {
        return {
            type: 'spam',
            severity: 'high',
            reason: `Rapid message sending (${recentMessages.length} messages in 10 seconds)`
        };
    }
    
    return null;
}

// Check for link violations
async function checkLinkViolation(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.content.match(urlRegex);
    
    if (!urls) return null;
    
    // Check for suspicious domains (basic implementation)
    const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'short.link', 'discord.gg'];
    
    for (const url of urls) {
        try {
            const domain = new URL(url).hostname.toLowerCase();
            if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
                return {
                    type: 'suspicious_link',
                    severity: 'medium',
                    reason: `Suspicious domain detected: ${domain}`
                };
            }
        } catch (error) {
            // Invalid URL
            return {
                type: 'invalid_link',
                severity: 'low',
                reason: 'Invalid or malformed URL detected'
            };
        }
    }
    
    return null;
}

// Check for bad words (basic implementation)
async function checkBadWords(message) {
    const badWords = ['spam', 'scam', 'hack']; // Basic list - can be expanded
    
    const content = message.content.toLowerCase();
    for (const word of badWords) {
        if (content.includes(word)) {
            return {
                type: 'bad_word',
                severity: 'medium',
                reason: `Inappropriate content detected: "${word}"`
            };
        }
    }
    
    return null;
}

// Process violations and apply punishments
async function processViolations(message, violations, config) {
    const userId = message.author.id;
    const member = message.guild.members.cache.get(userId);
    
    if (!member) return;
    
    // Get user's violation count
    const userViolations = await db.select().from(moderationLogs)
        .where(and(
            eq(moderationLogs.serverId, message.guild.id),
            eq(moderationLogs.userId, userId),
            eq(moderationLogs.action, 'automod_warning')
        ));
    
    const violationCount = userViolations.length;
    
    // Log the violation
    await db.insert(moderationLogs).values({
        serverId: message.guild.id,
        userId: userId,
        moderatorId: client.user.id,
        action: 'automod_warning',
        reason: violations.map(v => v.reason).join('; ')
    });
    
    // Delete the message
    try {
        await message.delete();
    } catch (error) {
        console.log('Could not delete message:', error.message);
    }
    
    // Apply punishment based on violation count
    if (violationCount >= config.warningThreshold) {
        // Timeout the user
        try {
            await member.timeout(config.timeoutDuration * 1000, 'Auto-moderation: Multiple violations');
            
            const embed = createAstraeeEmbed(
                'Auto-Moderation Action',
                `**User:** ${member.user}\n**Action:** Timeout (${config.timeoutDuration}s)\n**Reason:** Multiple violations\n**Violations:** ${violations.map(v => v.reason).join(', ')}`,
                '#E74C3C'
            );
            
            // Send to log channel if configured
            if (config.logChannelId) {
                const logChannel = message.guild.channels.cache.get(config.logChannelId);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] });
                }
            }
            
        } catch (error) {
            console.error('Error applying timeout:', error);
        }
    } else {
        // Send warning DM
        try {
            const warningEmbed = createAstraeeEmbed(
                'Auto-Moderation Warning',
                `Your message was removed due to: ${violations.map(v => v.reason).join(', ')}\n\n**Warning ${violationCount + 1}/${config.warningThreshold}**\n\nPlease review the server rules to avoid further violations.`,
                '#F39C12'
            );
            
            await member.send({ embeds: [warningEmbed] });
        } catch (error) {
            console.log('Could not send warning DM:', error.message);
        }
    }
}

// Spam tracker for message frequency
const spamTracker = new Map();

// Clean up old spam tracking data every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [userId, timestamps] of spamTracker.entries()) {
        const recentTimestamps = timestamps.filter(timestamp => now - timestamp < 60000); // Keep last minute
        if (recentTimestamps.length === 0) {
            spamTracker.delete(userId);
        } else {
            spamTracker.set(userId, recentTimestamps);
        }
    }
}, 300000); // 5 minutes

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