const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Collection, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { db } = require('./server/db');
const { users, embedTemplates, streams, welcomeSettings, reactionRoles, moderationLogs, monthlyStats, yearlySummaries, userLevels, scheduledMessages, autoModSettings } = require('./shared/schema');
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
            .addStringOption(option => option.setName('message_id').setDescription('Message ID to clear reaction roles from').setRequired(true)))
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
        const welcomeMessage = settings[0].welcomeMessage.replace('{user}', member.toString());
        await welcomeChannel.send(welcomeMessage);

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

        // Add the role to the member
        try {
            await member.roles.add(role);
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
            console.log(`✦ Role ${role.name} removed from ${user.username} via reaction ✦`);
        } catch (error) {
            console.error('Error removing role:', error);
        }

    } catch (error) {
        console.error('Error handling reaction remove:', error);
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
        const testMessage = settings[0].welcomeMessage.replace('{user}', interaction.user.toString());
        await welcomeChannel.send(testMessage);

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
            `**Status:** ${setting.enabled ? 'Enabled ✨' : 'Disabled ❌'}\n**Welcome Channel:** ${welcomeChannel || 'Not set'}\n**Goodbye Channel:** ${goodbyeChannel || 'Not set'}\n**Welcome Message:** ${setting.welcomeMessage}\n**Goodbye Message:** ${setting.goodbyeMessage}`,
            setting.enabled ? '#98FB98' : '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error getting welcomer status:', error);
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