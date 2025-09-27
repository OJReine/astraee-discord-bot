const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Collection, PermissionFlagsBits } = require('discord.js');
const { db } = require('./server/db');
const { users, embedTemplates, streams } = require('./shared/schema');
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
        .addUserOption(option => option.setName('model').setDescription('Model who will be streaming (defaults to you)'))
        .addIntegerOption(option => option.setName('days').setDescription('Days until due').setRequired(true)
            .addChoices(
                { name: '1 Day', value: 1 },
                { name: '3 Days', value: 3 },
                { name: '5 Days', value: 5 },
                { name: '7 Days', value: 7 }
            ))
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
        .addBooleanOption(option => option.setName('confirm').setDescription('Confirm you want to delete ALL streams').setRequired(true))
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
                
                await interaction.reply({ embeds: [embed], ephemeral: true });
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
            return interaction.reply({ embeds: [embed], ephemeral: true });
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
                await interaction.reply({ embeds: [embed], ephemeral: true });
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
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const templateList = templates.map((t, i) => 
            `${i + 1}. **${t.name}** ${t.title ? `- *${t.title}*` : ''}`
        ).join('\n');

        const embed = createAstraeeEmbed(
            'Template Archive',
            `Your stored templates:\n\n${templateList}\n\n*Use \`/embed send\` to deploy them with grace.*`
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
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
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const [existingTemplate] = await db.select().from(embedTemplates)
            .where(and(
                eq(embedTemplates.name, name),
                eq(embedTemplates.serverId, interaction.guild.id)
            ));

        if (!existingTemplate) {
            const embed = createAstraeeEmbed('Template Not Found', `No template named "${name}" exists in this server's archive.`, '#E74C3C');
            return interaction.reply({ embeds: [embed], ephemeral: true });
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
            return interaction.reply({ embeds: [embed], ephemeral: true });
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
        
        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
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
        return interaction.reply({ embeds: [embed], ephemeral: true });
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
            return interaction.reply({ embeds: [embed], ephemeral: true });
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
            return interaction.reply({ embeds: [embed], ephemeral: true });
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
                await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
            } catch (error) {
                console.log('Could not send to target channel:', error.message);
                // Fallback to regular reply if channel send fails
                await interaction.reply({ 
                    content: responseText,
                    embeds: [embed],
                    ephemeral: ephemeral
                });
            }
        } else {
            // Send regular reply if no target channel
            await interaction.reply({ 
                content: responseText,
                embeds: [embed],
                ephemeral: ephemeral
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
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Handle other database errors
        const embed = createAstraeeEmbed(
            'Stream Creation Failed',
            'An error occurred while creating the stream. Please try again later.',
            '#E74C3C'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
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
        return interaction.reply({ embeds: [embed], ephemeral: true });
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
            return interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        } catch (error) {
            console.log('Could not send to target channel:', error.message);
            const errorEmbed = createAstraeeEmbed(
                'Delivery Failed',
                `Could not send to ${targetChannel}. Please check permissions.`,
                '#E74C3C'
            );
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }

    await interaction.reply({ embeds: [embed], ephemeral: ephemeral });
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
        return interaction.reply({ embeds: [embed], ephemeral: true });
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
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Delete completed stream from database instead of marking as completed
    await db.delete(streams)
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
            await interaction.reply({ embeds: [confirmEmbed], ephemeral: ephemeral });
        } catch (error) {
            console.log('Could not send to target channel:', error.message);
            const errorEmbed = createAstraeeEmbed(
                'Delivery Failed',
                `Could not send to ${targetChannel}. Please check permissions.`,
                '#E74C3C'
            );
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    } else {
        // Send regular reply if no target channel
        await interaction.reply({ 
            content: responseText,
            embeds: [completionEmbed],
            ephemeral: ephemeral
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
            cutoffDate.setDate(cutoffDate.getDate() - 7); // Clean up streams older than 7 days

            const deletedStreams = await db.delete(streams)
                .where(lt(streams.createdAt, cutoffDate));

            console.log(`✦ Daily cleanup completed - removed old streams ✦`);
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
        return interaction.reply({ embeds: [embed], ephemeral: true });
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

    await interaction.reply({ embeds: [embed], ephemeral: true });
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
            await interaction.reply({ content: 'Stream list sent to the specified channel.', ephemeral: true });
        } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
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
        await interaction.reply({ content: 'Stream list sent to the specified channel.', ephemeral: true });
    } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

// Cleanup handler - remove old completed streams
async function handleCleanup(interaction) {
    const days = interaction.options.getInteger('days') || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
        // Find old streams (both completed and overdue)
        const oldStreams = await db.select().from(streams)
            .where(and(
                eq(streams.serverId, interaction.guild.id),
                lt(streams.createdAt, cutoffDate)
            ));

        if (oldStreams.length === 0) {
            const embed = createAstraeeEmbed(
                'Database Cleanup',
                `No streams older than ${days} days found. Database is already clean! ✨`,
                '#98FB98'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Delete old streams (regardless of status)
        await db.delete(streams)
            .where(and(
                eq(streams.serverId, interaction.guild.id),
                lt(streams.createdAt, cutoffDate)
            ));

        const embed = createAstraeeEmbed(
            'Database Cleanup Complete',
            `Successfully cleaned up ${oldStreams.length} completed streams older than ${days} days.\n\n**Streams removed:**\n${oldStreams.map(s => `• ${s.streamId} - ${s.itemName}`).join('\n')}`,
            '#98FB98'
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error during cleanup:', error);
        const embed = createAstraeeEmbed(
            'Cleanup Error',
            'An error occurred while cleaning up the database. Please try again later.',
            '#E74C3C'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
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
        return interaction.reply({ embeds: [embed], ephemeral: true });
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
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Delete ALL streams for this server
        await db.delete(streams)
            .where(eq(streams.serverId, interaction.guild.id));

        const embed = createAstraeeEmbed(
            'Database Cleanup Complete',
            `⚠️ **ALL STREAMS DELETED** ⚠️\n\nSuccessfully removed ${allStreams.length} streams from the database.\n\n**Streams removed:**\n${allStreams.map(s => `• ${s.streamId} - ${s.itemName}`).join('\n')}`,
            '#E74C3C'
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error during cleanup all:', error);
        const embed = createAstraeeEmbed(
            'Cleanup Error',
            'An error occurred while cleaning up the database. Please try again later.',
            '#E74C3C'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
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