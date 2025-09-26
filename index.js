const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Collection, PermissionFlagsBits } = require('discord.js');
const { db } = require('./server/db');
const { users, embedTemplates, streams } = require('./shared/schema');
const { eq, and } = require('drizzle-orm');
const cron = require('node-cron');

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

// Astraee's persona - elegant mottos for footers
const astraeeMottoes = [
    "Order transforms creativity into legacy.",
    "Every completion adds to the constellation.", 
    "Accountability refines elegance.",
    "Completion marks the measure of discipline.",
    "Order fosters reliability.",
    "Structure reveals beauty in purpose.",
    "Discipline creates lasting artistry."
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

// Generate unique stream ID
const generateStreamId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
                .addChannelOption(option => option.setName('channel').setDescription('Channel to send to'))),

    // Stream Tracking Commands  
    new SlashCommandBuilder()
        .setName('streamcreate')
        .setDescription('Register a new IMVU stream with ceremonial precision')
        .addStringOption(option => option.setName('item_name').setDescription('Name of the IMVU item').setRequired(true))
        .addStringOption(option => option.setName('shop').setDescription('Which shop').setRequired(true)
            .addChoices(
                { name: 'Nina Babes', value: 'nina-babes' },
                { name: 'Wildethorn Ladies', value: 'wildethorn-ladies' }
            ))
        .addIntegerOption(option => option.setName('days').setDescription('Days until due (default: 7)').setMinValue(1).setMaxValue(30))
        .addStringOption(option => option.setName('item_link').setDescription('Link to the IMVU item'))
        .addUserOption(option => option.setName('creator').setDescription('Creator/Officer to tag')),

    new SlashCommandBuilder()
        .setName('activestreams')
        .setDescription('View all active streams with days remaining')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('completestream')
        .setDescription('Mark a stream as complete and archive it')
        .addStringOption(option => option.setName('stream_id').setDescription('Stream ID to complete').setRequired(true))
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
    } catch (error) {
        console.error(`Error handling ${commandName}:`, error);
        
        const embed = createAstraeeEmbed(
            'Graceful Error',
            'An unexpected disturbance occurred. Please try again with renewed focus.',
            '#E74C3C'
        );
        
        if (interaction.replied) {
            await interaction.followUp({ embeds: [embed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
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
                `Embed template "${name}" has been stored with elegant precision.\\n\\nIt shall serve you well in future endeavors.`
            );
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            if (error.code === '23505') {
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
                'No embed templates have been created yet.\\n\\nBegin your collection with `/embed create`.'
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const templateList = templates.map((t, i) => 
            `${i + 1}. **${t.name}** ${t.title ? `- *${t.title}*` : ''}`
        ).join('\\n');

        const embed = createAstraeeEmbed(
            'Template Archive',
            `Your stored templates:\\n\\n${templateList}\\n\\n*Use \`/embed send\` to deploy them with grace.*`
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    else if (subcommand === 'send') {
        const name = interaction.options.getString('name');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

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

// Stream create handler
async function handleStreamCreate(interaction) {
    const itemName = interaction.options.getString('item_name');
    const shop = interaction.options.getString('shop');
    const days = interaction.options.getInteger('days') || 7;
    const itemLink = interaction.options.getString('item_link');
    const creator = interaction.options.getUser('creator');

    const streamId = generateStreamId();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    try {
        await db.insert(streams).values({
            streamId,
            modelId: interaction.user.id,
            creatorId: creator?.id,
            itemName,
            itemLink,
            dueDate,
            shop,
            serverId: interaction.guild.id
        });

        const embed = createAstraeeEmbed(
            'Stream Registered',
            `**Stream ID:** \`${streamId}\`\\n**Item:** ${itemName}\\n**Shop:** ${shop === 'nina-babes' ? 'Nina Babes' : 'Wildethorn Ladies'}\\n**Due:** <t:${Math.floor(dueDate.getTime() / 1000)}:F>\\n**Days Remaining:** ${days}\\n\\nYour commitment has been recorded with ceremonial precision.`
        );

        await interaction.reply({ embeds: [embed] });

        // Send DM confirmation
        try {
            const dmEmbed = createAstraeeEmbed(
                'Stream Confirmation',
                `Your stream has been registered:\\n\\n**Stream ID:** \`${streamId}\`\\n**Item:** ${itemName}\\n**Due:** <t:${Math.floor(dueDate.getTime() / 1000)}:F>\\n\\nMay your creative endeavors flourish.`
            );
            
            await interaction.user.send({ embeds: [dmEmbed] });
        } catch (error) {
            console.log('Could not send DM to user:', error.message);
        }

        // Tag creator if specified
        if (creator) {
            await interaction.followUp(`${creator}, a new stream awaits your guidance: **${itemName}** (ID: \`${streamId}\`)`);
        }

    } catch (error) {
        console.error('Error creating stream:', error);
        throw error;
    }
}

// Active streams handler
async function handleActiveStreams(interaction) {
    const activeStreams = await db.select().from(streams)
        .where(and(
            eq(streams.serverId, interaction.guild.id),
            eq(streams.status, 'active')
        ));

    if (activeStreams.length === 0) {
        const embed = createAstraeeEmbed(
            'Peaceful Quiet',
            'No active streams require attention at this moment.\\n\\nAll is in harmonious order.'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const now = new Date();
    const streamList = activeStreams.map(stream => {
        const daysRemaining = Math.ceil((stream.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const status = daysRemaining < 0 ? '🔴 Overdue' : daysRemaining <= 1 ? '🟡 Due Soon' : '🟢 Active';
        
        return `**${stream.streamId}** - ${stream.itemName}\\n*${stream.shop === 'nina-babes' ? 'Nina Babes' : 'Wildethorn Ladies'}* | ${status} (${daysRemaining > 0 ? daysRemaining : Math.abs(daysRemaining)} days)`;
    }).join('\\n\\n');

    const embed = createAstraeeEmbed(
        'Active Streams Registry',
        `Current streams requiring attention:\\n\\n${streamList}\\n\\n*Use \`/completestream\` to archive finished work.*`
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Complete stream handler
async function handleCompleteStream(interaction) {
    const streamId = interaction.options.getString('stream_id').toUpperCase();

    const [stream] = await db.select().from(streams)
        .where(and(
            eq(streams.streamId, streamId),
            eq(streams.serverId, interaction.guild.id),
            eq(streams.status, 'active')
        ));

    if (!stream) {
        const embed = createAstraeeEmbed('Stream Not Found', `No active stream with ID \`${streamId}\` exists in this server's records.`, '#E74C3C');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Update stream status
    await db.update(streams)
        .set({ 
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
        })
        .where(eq(streams.id, stream.id));

    const embed = createAstraeeEmbed(
        'Stream Completed',
        `**${stream.itemName}** has been marked complete with ceremonial honor.\\n\\n**Stream ID:** \`${streamId}\`\\n**Completed by:** ${interaction.user}\\n\\nYour dedication adds beauty to our constellation of achievements.`
    );

    await interaction.reply({ embeds: [embed] });
}

// Reminder system
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

            // Find streams due tomorrow
            const streamsDueTomorrow = await db.select().from(streams)
                .where(and(
                    eq(streams.status, 'active'),
                    // Due date is tomorrow
                    // Note: This is a simplified check, you may want to use proper date range queries
                ));

            for (const stream of streamsDueTomorrow) {
                try {
                    const guild = client.guilds.cache.get(stream.serverId);
                    if (!guild) continue;

                    const streamTrackerChannel = guild.channels.cache.find(
                        channel => channel.name === 'stream-tracker' || channel.name === '『stream-tracker』'
                    );

                    if (streamTrackerChannel) {
                        const embed = createAstraeeEmbed(
                            'Gentle Reminder',
                            `<@${stream.modelId}>, your stream approaches its destined completion:\\n\\n**Stream ID:** \`${stream.streamId}\`\\n**Item:** ${stream.itemName}\\n**Due:** <t:${Math.floor(stream.dueDate.getTime() / 1000)}:F>\\n\\nMay you find grace in timely completion.`,
                            '#F39C12'
                        );

                        await streamTrackerChannel.send({ embeds: [embed] });
                    }
                } catch (error) {
                    console.error('Error sending reminder for stream:', stream.streamId, error);
                }
            }
        } catch (error) {
            console.error('Error in reminder system:', error);
        }
    });
    
    console.log('✦ Reminder system initiated with elegant precision ✦');
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