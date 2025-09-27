const { pgTable, serial, text, timestamp, integer, boolean, jsonb, unique } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Users table - tracks Discord users and their roles
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  discordId: text('discord_id').notNull().unique(),
  username: text('username').notNull(),
  roles: jsonb('roles').default([]),
  serverId: text('server_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Embed templates table - stores reusable embeds
const embedTemplates = pgTable('embed_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title'),
  description: text('description'),
  color: text('color').default('#9B59B6'),
  footer: text('footer'),
  fields: jsonb('fields').default([]),
  authorId: text('author_id').notNull(),
  serverId: text('server_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueNamePerServer: unique().on(table.name, table.serverId)
}));

// Stream records table - tracks IMVU streams
const streams = pgTable('streams', {
  id: serial('id').primaryKey(),
  streamId: text('stream_id').notNull().unique(), // Generated unique ID for the stream
  modelId: text('model_id').notNull(), // Discord user ID of model
  creatorId: text('creator_id'), // Discord user ID of creator (optional)
  itemName: text('item_name').notNull(),
  itemLink: text('item_link'),
  dueDate: timestamp('due_date').notNull(),
  status: text('status').notNull().default('active'), // active, completed, overdue
  shop: text('shop').notNull(), // 'nina-babes' or 'wildethorn-ladies'
  serverId: text('server_id').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Welcome system settings
const welcomeSettings = pgTable('welcome_settings', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull().unique(),
  welcomeChannelId: text('welcome_channel_id'),
  goodbyeChannelId: text('goodbye_channel_id'),
  welcomeMessage: text('welcome_message').default('Welcome to our constellation, {user}! ✦'),
  goodbyeMessage: text('goodbye_message').default('Farewell, {user}. May your light shine elsewhere. ✦'),
  // Rich embed settings
  useRichEmbed: boolean('use_rich_embed').default(false),
  embedTitle: text('embed_title').default('✦ A New Star Joins Us ✦'),
  embedDescription: text('embed_description'),
  embedColor: text('embed_color').default('#9B59B6'),
  embedThumbnail: text('embed_thumbnail'), // URL for thumbnail
  embedImage: text('embed_image'), // URL for image
  embedFooter: text('embed_footer').default('✦ "Every arrival marks the start of a new chapter." - Astraee ✦'),
  // Channel links for first steps
  rulesChannelId: text('rules_channel_id'),
  startHereChannelId: text('start_here_channel_id'),
  introChannelId: text('intro_channel_id'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Reaction roles system
const reactionRoles = pgTable('reaction_roles', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull(),
  messageId: text('message_id').notNull(),
  emoji: text('emoji').notNull(),
  roleId: text('role_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Role usage tracking to prevent abuse
const roleUsage = pgTable('role_usage', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull(),
  userId: text('user_id').notNull(),
  roleId: text('role_id').notNull(),
  messageId: text('message_id').notNull(),
  emoji: text('emoji').notNull(),
  action: text('action').notNull(), // 'add' or 'remove'
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserRolePerMessage: unique().on(table.userId, table.roleId, table.messageId)
}));

// Moderation logs
const moderationLogs = pgTable('moderation_logs', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull(),
  userId: text('user_id').notNull(),
  moderatorId: text('moderator_id').notNull(),
  action: text('action').notNull(), // kick, ban, timeout, mute, warn
  reason: text('reason'),
  duration: integer('duration'), // for timeout/mute in minutes
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Monthly statistics tracking
const monthlyStats = pgTable('monthly_stats', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull(),
  userId: text('user_id').notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  streamCount: integer('stream_count').default(0),
  completedStreams: integer('completed_streams').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserMonth: unique().on(table.userId, table.month, table.year, table.serverId)
}));

// Yearly summaries
const yearlySummaries = pgTable('yearly_summaries', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull(),
  year: integer('year').notNull(),
  totalStreams: integer('total_streams').notNull(),
  submittedBy: text('submitted_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  uniqueYearPerServer: unique().on(table.year, table.serverId)
}));

// User levels and experience
const userLevels = pgTable('user_levels', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull(),
  userId: text('user_id').notNull(),
  level: integer('level').default(1),
  experience: integer('experience').default(0),
  totalMessages: integer('total_messages').default(0),
  lastActive: timestamp('last_active').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  uniqueUserPerServer: unique().on(table.userId, table.serverId)
}));

// Scheduled messages
const scheduledMessages = pgTable('scheduled_messages', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull(),
  channelId: text('channel_id').notNull(),
  message: text('message').notNull(),
  scheduledFor: timestamp('scheduled_for').notNull(),
  createdBy: text('created_by').notNull(),
  executed: boolean('executed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Auto-moderation settings
const autoModSettings = pgTable('auto_mod_settings', {
  id: serial('id').primaryKey(),
  serverId: text('server_id').notNull().unique(),
  spamDetection: boolean('spam_detection').default(true),
  maxMessagesPerMinute: integer('max_messages_per_minute').default(5),
  inappropriateContentFilter: boolean('inappropriate_content_filter').default(true),
  autoDeleteSpam: boolean('auto_delete_spam').default(true),
  warnThreshold: integer('warn_threshold').default(3),
  muteThreshold: integer('mute_threshold').default(5),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations
const usersRelations = relations(users, ({ many }) => ({
  embedTemplates: many(embedTemplates),
  streams: many(streams),
  moderationLogs: many(moderationLogs),
  monthlyStats: many(monthlyStats),
  userLevels: many(userLevels)
}));

const embedTemplatesRelations = relations(embedTemplates, ({ one }) => ({
  author: one(users, {
    fields: [embedTemplates.authorId],
    references: [users.discordId]
  })
}));

const streamsRelations = relations(streams, ({ one }) => ({
  model: one(users, {
    fields: [streams.modelId],
    references: [users.discordId]
  })
}));

const welcomeSettingsRelations = relations(welcomeSettings, ({ one }) => ({
  server: one(users, {
    fields: [welcomeSettings.serverId],
    references: [users.serverId]
  })
}));

const moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  user: one(users, {
    fields: [moderationLogs.userId],
    references: [users.discordId]
  }),
  moderator: one(users, {
    fields: [moderationLogs.moderatorId],
    references: [users.discordId]
  })
}));

const monthlyStatsRelations = relations(monthlyStats, ({ one }) => ({
  user: one(users, {
    fields: [monthlyStats.userId],
    references: [users.discordId]
  })
}));

const userLevelsRelations = relations(userLevels, ({ one }) => ({
  user: one(users, {
    fields: [userLevels.userId],
    references: [users.discordId]
  })
}));

module.exports = {
  users,
  embedTemplates,
  streams,
  welcomeSettings,
  reactionRoles,
  roleUsage,
  moderationLogs,
  monthlyStats,
  yearlySummaries,
  userLevels,
  scheduledMessages,
  autoModSettings,
  usersRelations,
  embedTemplatesRelations,
  streamsRelations,
  welcomeSettingsRelations,
  moderationLogsRelations,
  monthlyStatsRelations,
  userLevelsRelations
};