# ✦ Astraee Feature Documentation ✦

## Overview

Astraee is a comprehensive Discord bot designed specifically for IMVU modeling agencies and streaming collectives. This document provides detailed information about all available features, their implementation, and usage patterns.

## Core Philosophy

Astraee embodies "structure as beauty" - she brings elegance, discipline, and accountability to community management while celebrating creativity and achievement. Her communication style is refined and ceremonial, using ✦ symbols for titles and ❖ for poetic footer mottos.

## Feature Categories

### 1. Stream Tracking & Management

#### Purpose
Stream tracking is Astraee's core functionality, designed to manage IMVU modeling streams with precision and accountability.

#### Commands
- **`/streamcreate`** - Register new streams
  - **Items**: Name of IMVU items to be streamed
  - **Days**: Duration until due (1, 3, 5, or 7 days)
  - **Model**: User who will be streaming (defaults to command user)
  - **Creator**: Creator to ping in embed (optional)
  - **Role**: Role to ping for notifications (e.g., @Stream Officers)
  - **Channel**: Channel to post stream log (optional)
  - **Ephemeral**: Make response ephemeral (optional)

- **`/activestreams`** - View all active streams
  - **Channel**: Channel to send list to (optional)
  - **Role**: Role to ping (optional)
  - **Ephemeral**: Make response ephemeral (optional)

- **`/completestream`** - Mark streams as complete
  - **Stream ID**: ID of stream to complete
  - **Channel**: Channel to post completion log (optional)
  - **Role**: Role to ping for completion notification
  - **Ephemeral**: Make response ephemeral (optional)

- **`/streaminfo`** - Get detailed stream information
  - **Stream ID**: ID of stream to look up

- **`/streamlist`** - List streams with filters
  - **Status**: Filter by active/completed/overdue
  - **Model**: Filter by specific model
  - **Channel**: Channel to send list to (optional)

- **`/cleanup`** - Clean up old completed streams (Officer-only)
  - **Days**: Delete streams older than X days (default: 7)

- **`/cleanupall`** - Emergency cleanup of all streams (Officer-only)
  - **Confirm**: Confirmation boolean

#### Workflow
1. **Registration**: Admin or model creates stream with `/streamcreate`
2. **Tracking**: Astraee generates unique Stream ID and logs details
3. **Notification**: DM sent to model with stream details
4. **Monitoring**: Role pinged for notifications, creator pinged in embed
5. **Reminders**: Automated reminder 1 day before due date
6. **Completion**: Model uses `/completestream` when finished
7. **Archival**: Stream marked as completed and kept for 7 days
8. **Cleanup**: Automatic deletion after 7 days or manual cleanup

#### Database Schema
- **streams** table stores all stream records
- **monthlyStats** table tracks completion statistics
- **yearlySummaries** table stores annual performance data

### 2. Moderation & Community Management

#### Purpose
Comprehensive moderation tools with logging and accountability features.

#### Commands
- **`/kick`** - Kick users with reason logging
  - **User**: User to kick
  - **Reason**: Reason for kick (optional)
  - **Ephemeral**: Make response ephemeral (optional)

- **`/ban`** - Ban users with message deletion
  - **User**: User to ban
  - **Reason**: Reason for ban (optional)
  - **Delete Days**: Days of messages to delete (0-7)

- **`/timeout`** - Timeout users for specified duration
  - **User**: User to timeout
  - **Duration**: Timeout duration in minutes
  - **Reason**: Reason for timeout (optional)

- **`/mute`** - Mute users
  - **User**: User to mute
  - **Reason**: Reason for mute (optional)

- **`/unmute`** - Unmute users
  - **User**: User to unmute

- **`/modlogs`** - View moderation history
  - **User**: User to view logs for (optional)

#### Features
- **Logging**: All moderation actions logged to database
- **Reason Tracking**: Reasons stored for accountability
- **Permission Checks**: Proper permission validation
- **Elegant Responses**: Ceremonial confirmation messages

#### Database Schema
- **moderationLogs** table stores all moderation actions
- **autoModSettings** table stores auto-moderation configuration

### 3. Reaction Role Management

#### Purpose
Interactive role assignment system with usage limits to prevent abuse.

#### Commands
- **`/reactionrole add`** - Add reaction role to message
  - **Message ID**: ID of message to add reaction role to
  - **Emoji**: Emoji to use for reaction
  - **Role**: Role to assign/remove

- **`/reactionrole remove`** - Remove reaction role from message
  - **Message ID**: ID of message to remove reaction role from
  - **Emoji**: Emoji to remove

- **`/reactionrole list`** - List all reaction roles for message
  - **Message ID**: ID of message to list reaction roles for

- **`/reactionrole clear`** - Clear all reaction roles from message
  - **Message ID**: ID of message to clear reaction roles from

#### Features
- **Usage Limits**: One role per user per message to prevent abuse
- **Automatic Assignment**: Roles assigned/removed on reaction add/remove
- **Database Tracking**: Usage tracked in **roleUsage** table

#### Database Schema
- **reactionRoles** table stores reaction role assignments
- **roleUsage** table tracks user usage to prevent abuse

### 4. Statistics & Performance Tracking

#### Purpose
Comprehensive tracking of stream performance and community engagement.

#### Commands
- **`/stats monthly`** - View current month's stream statistics
- **`/stats yearly`** - View yearly performance summaries
- **`/stats leaderboard`** - Display top performers
- **`/stats submit`** - Submit yearly summaries (Admin-only)
  - **Streams**: Total number of streams
  - **Average Streams**: Average streams per month

#### Features
- **Automatic Tracking**: Stream completions automatically update monthly stats
- **Yearly Summaries**: Admin-submitted annual performance data
- **Leaderboards**: Top performer rankings
- **Aesthetic Displays**: Elegant embed formatting for statistics

#### Database Schema
- **monthlyStats** table stores monthly completion counts
- **yearlySummaries** table stores annual performance summaries

### 5. Level System & XP Tracking

#### Purpose
Gamification system to encourage community engagement and recognize active members.

#### Commands
- **`/level view`** - Check user's level and XP
  - **User**: User to check level for (optional, defaults to command user)

- **`/level leaderboard`** - View server level rankings

- **`/level give`** - Award XP to users (Admin-only)
  - **User**: User to give XP to
  - **Amount**: Amount of XP to give

- **`/level setreward`** - Set role rewards for levels (Admin-only)
  - **Level**: Level to set reward for
  - **Role**: Role to assign at this level

- **`/level removereward`** - Remove role rewards (Admin-only)
  - **Level**: Level to remove reward for

- **`/level rewards`** - View available level rewards

- **`/level reset`** - Reset all levels (Admin-only)
  - **Confirm**: Confirmation boolean

#### Features
- **Automatic XP**: Users gain XP from sending messages
- **Level Progression**: XP requirements increase with each level
- **Role Rewards**: Automatic role assignment at specific levels
- **Level Up Notifications**: Celebratory messages when users level up
- **Server-Specific**: Each server has independent level systems

#### Database Schema
- **userLevels** table stores user XP and level data

### 6. Automated Systems

#### Auto-Moderation
- **Spam Protection**: Automatic timeout for repeated messages
- **Link Filtering**: Block or allow links based on server rules
- **Mention Limits**: Prevent mention spam
- **Bad Word Detection**: Filter inappropriate content
- **Whitelist System**: Exempt channels/users from auto-moderation
- **Warning System**: Progressive warnings before timeouts
- **Auto-Timeout**: Automatic timeout for severe violations

#### Scheduled Messages
- **One-Time Messages**: Schedule messages for specific dates
- **Recurring Messages**: Daily, weekly, or monthly announcements
- **Role Pinging**: Optional role mentions in scheduled messages
- **Cron Scheduling**: Reliable timing system for message delivery

#### Automated Reminders
- **Stream Reminders**: 1 day before stream due dates
- **DM Notifications**: Direct messages to models
- **Channel Notifications**: Announcements in stream tracker channels

### 7. Utility Commands

#### Purpose
General utility functions for server management.

#### Commands
- **`/say`** - Make Astraee speak messages to channels
  - **Message**: Message to send
  - **Channel**: Channel to send to (defaults to current channel)
  - **Ephemeral**: Make response ephemeral (optional)

## Technical Implementation

### Database Architecture
- **PostgreSQL**: Primary database with Drizzle ORM
- **Server Scoping**: All data scoped by `serverId` for multi-server support
- **Efficient Storage**: Optimized for free tier database limits
- **Automatic Cleanup**: Old data automatically removed to maintain performance

### Security Features
- **Permission Validation**: All commands check proper Discord permissions
- **Input Sanitization**: User input validated and sanitized
- **Rate Limiting**: Built-in protection against command spam
- **Error Handling**: Graceful error handling with user-friendly messages

### Performance Optimizations
- **Interaction Tracking**: Prevents duplicate command processing
- **Efficient Queries**: Optimized database queries for fast responses
- **Caching**: Strategic caching for frequently accessed data
- **Background Processing**: Non-blocking operations for better performance

## Customization Options

### Server-Specific Configuration
- **Channel Names**: Flexible channel name patterns
- **Role Assignments**: Customizable role requirements
- **Permission Levels**: Granular permission control
- **Auto-Moderation Settings**: Server-specific moderation rules

### Aesthetic Customization
- **Color Schemes**: Pastel color palette for different embed types
- **Emoji Usage**: Custom aesthetic emojis and Unicode symbols
- **Message Formatting**: Consistent elegant formatting
- **Footer Mottos**: Poetic footer messages for different contexts

## Integration Capabilities

### Multi-Server Support
- **Independent Data**: Each server maintains separate data
- **Scalable Architecture**: Designed to handle multiple servers efficiently
- **Server-Specific Settings**: Customizable per-server configuration

### External Service Integration
- **Database Hosting**: Compatible with Neon, Supabase, and other PostgreSQL providers
- **Cloud Deployment**: Optimized for Render, Railway, and other cloud platforms
- **Monitoring**: Built-in logging and error tracking

## Future Expansion Possibilities

### Planned Features
- **Dashboard Interface**: Web-based management interface
- **Advanced Analytics**: Detailed performance metrics
- **Integration APIs**: Third-party service integrations
- **Mobile Support**: Mobile-optimized interfaces

### Extensibility
- **Modular Architecture**: Easy to add new features
- **Plugin System**: Support for custom extensions
- **API Endpoints**: RESTful API for external integrations
- **Webhook Support**: Real-time event notifications

## Support & Maintenance

### Monitoring
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Built-in performance monitoring
- **Health Checks**: Automated system health verification

### Updates & Maintenance
- **Automatic Cleanup**: Self-maintaining database operations
- **Version Control**: Git-based version management
- **Deployment Automation**: Streamlined deployment processes

---

❖ "In structure lies the foundation of all great achievements." ❖
