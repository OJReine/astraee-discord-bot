# ✦ External Database Setup Guide ✦

Since Render's free PostgreSQL databases are being discontinued, here are the best free alternatives:

## 🏆 **Neon (Recommended)**

### **Why Neon?**
- ✅ **Always-on** - No sleeping
- ✅ **Generous free tier** - 512MB storage, 10GB transfer/month
- ✅ **Easy setup** - Just sign up and get connection string
- ✅ **PostgreSQL** - Perfect compatibility
- ✅ **Great performance** - Fast and reliable

### **Neon Setup Steps:**

#### 1. Create Account
1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up"
3. Sign up with GitHub (same account as your bot)
4. Verify your email

#### 2. Create Database
1. Click "Create Project"
2. **Project Name**: `astraee-discord-bot`
3. **Database Name**: `astraee_db`
4. **Region**: Choose closest to you
5. Click "Create Project"

#### 3. Get Connection String
1. In your project dashboard, go to "Connection Details"
2. Copy the **"Connection String"** (starts with `postgresql://`)
3. It will look like: `postgresql://username:password@hostname/database`

#### 4. Update Render
1. Go to your Render web service dashboard
2. Go to "Environment" tab
3. Update `DATABASE_URL` with your Neon connection string
4. Click "Save Changes"
5. Render will automatically redeploy

#### 5. Set Up Database Tables
After connecting to Neon, run the database setup:
1. In Render dashboard, go to "Shell" tab
2. Run: `npm run db:setup`
3. This will create all necessary tables

---

## ⭐ **Supabase Alternative**

### **Supabase Setup Steps:**

#### 1. Create Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub
4. Create new organization

#### 2. Create Project
1. Click "New Project"
2. **Name**: `astraee-discord-bot`
3. **Database Password**: Create a strong password
4. **Region**: Choose closest to you
5. Click "Create new project"

#### 3. Get Connection String
1. Go to "Settings" → "Database"
2. Scroll down to "Connection string"
3. Copy the **"URI"** connection string
4. Replace `[YOUR-PASSWORD]` with your database password

#### 4. Update Render
1. Go to Render web service → "Environment"
2. Update `DATABASE_URL` with Supabase connection string
3. Save and redeploy

#### 5. Set Up Database Tables
1. In Render dashboard, go to "Shell" tab
2. Run: `npm run db:setup`

---

## ⭐ **ElephantSQL Alternative**

### **ElephantSQL Setup Steps:**

#### 1. Create Account
1. Go to [elephantsql.com](https://elephantsql.com)
2. Click "Get a managed database today"
3. Sign up with email or GitHub

#### 2. Create Database
1. Click "Create New Instance"
2. **Name**: `astraee-discord-bot`
3. **Plan**: `Tiny Turtle` (Free)
4. **Region**: Choose closest to you
5. Click "Review" → "Create instance"

#### 3. Get Connection String
1. Click on your database instance
2. Copy the **"URL"** connection string
3. It will look like: `postgresql://username:password@hostname/database`

#### 4. Update Render
1. Go to Render web service → "Environment"
2. Update `DATABASE_URL` with ElephantSQL connection string
3. Save and redeploy

#### 5. Set Up Database Tables
1. In Render dashboard, go to "Shell" tab
2. Run: `npm run db:setup`

---

## ✦ **Database Setup Commands** ✦

After connecting any external database, run these commands in Render's Shell:

### **Option 1: Use Setup Script (Recommended)**
```bash
npm run db:setup
```

### **Option 2: Use Drizzle (Alternative)**
```bash
npm run db:push
```

Both commands will create the necessary tables:
- `users` - Discord user tracking
- `embed_templates` - Stored embed templates
- `streams` - IMVU stream records

---

## ✦ **Environment Variables** ✦

Make sure these are set in your Render web service:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DATABASE_URL=your_external_database_connection_string
NODE_ENV=production
```

---

## ✦ **Free Tier Comparison** ✦

| Service | Storage | Connections | Transfer | Always-On |
|---------|---------|-------------|----------|-----------|
| **Neon** | 512MB | Unlimited | 10GB/month | ✅ Yes |
| **Supabase** | 500MB | 60 | 2GB/month | ✅ Yes |
| **ElephantSQL** | 20MB | 5 | Unlimited | ✅ Yes |
| **PlanetScale** | 1GB | Unlimited | 1B reads/month | ✅ Yes |

---

## ✦ **Recommendation** ✦

**Use Neon** - it offers the best free tier with:
- ✅ Most storage (512MB)
- ✅ Unlimited connections
- ✅ Good transfer limits
- ✅ Always-on
- ✅ Easy setup
- ✅ Great performance

---

## ✦ **Troubleshooting** ✦

### **Database Connection Issues:**
- ✅ Check connection string format
- ✅ Verify database credentials
- ✅ Ensure database is accessible from Render's IPs
- ✅ Check Render logs for connection errors

### **Table Creation Issues:**
- ✅ Run `npm run db:setup` in Render Shell
- ✅ Check database permissions
- ✅ Verify connection string is correct

### **Bot Not Starting:**
- ✅ Check `DATABASE_URL` is set correctly
- ✅ Verify database is accessible
- ✅ Check Render logs for errors

---

**Ready to set up your external database? Start with Neon for the best experience!** ✦
