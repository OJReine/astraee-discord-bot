const { pgTable, serial, text, timestamp, integer, boolean, jsonb } = require('drizzle-orm/pg-core');
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
});

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

// Relations
const usersRelations = relations(users, ({ many }) => ({
  embedTemplates: many(embedTemplates),
  streams: many(streams)
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

module.exports = {
  users,
  embedTemplates,
  streams,
  usersRelations,
  embedTemplatesRelations,
  streamsRelations
};