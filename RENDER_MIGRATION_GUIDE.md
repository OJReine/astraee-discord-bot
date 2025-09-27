# ✦ Render Migration Guide for Astraee Bot ✦

## **Why Migrate to Render?**

Based on your logs, Fly.io is causing several issues:
- ❌ **Bot crashes** due to Discord API errors
- ❌ **Port binding issues** despite correct configuration
- ❌ **Machine restarts** causing instability
- ❌ **Duplicate interactions** from Discord API

Render offers:
- ✅ **More stable hosting** for Discord bots
- ✅ **Better error handling** and recovery
- ✅ **Simpler deployment** process
- ✅ **Free tier** with 750 hours/month
- ✅ **Works with your existing Neon database**

---

## **🚀 Step-by-Step Migration**

### **Step 1: Prepare Your Code**

Your code is already ready! The fixes we just made include:
- ✅ **Interaction tracking** to prevent duplicates
- ✅ **DM functionality removed** to prevent conflicts
- ✅ **Better error handling** for Discord API errors
- ✅ **Express server** for keep-alive functionality

### **Step 2: Create Render Account**

1. Go to [render.com](https://render.com)
2. Sign up with your **GitHub account**
3. Verify your email address

### **Step 3: Create New Web Service**

1. **Click "New +"** → **"Web Service"**
2. **Connect your GitHub repository**: `OJReine/astraee-discord-bot`
3. **Configure the service**:
   - **Name**: `astraee-discord-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### **Step 4: Set Environment Variables**

In Render dashboard, go to **Environment** tab and add:

```
DISCORD_TOKEN=your_discord_bot_token
DATABASE_URL=your_neon_database_url
NODE_ENV=production
PORT=3000
```

### **Step 5: Configure Auto-Deploy**

1. **Branch**: `main`
2. **Auto-Deploy**: `Yes`
3. **Pull Request Previews**: `No`

### **Step 6: Deploy**

1. **Click "Create Web Service"**
2. **Wait for deployment** (2-3 minutes)
3. **Check logs** for successful startup

---

## **🔧 Render-Specific Configuration**

### **render.yaml (Already Created)**

Your `render.yaml` file is already configured:

```yaml
services:
  - type: web
    name: astraee-discord-bot
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

### **Keep-Alive Setup**

Since Render free tier sleeps after 15 minutes of inactivity:

1. **Sign up for UptimeRobot**: [uptimerobot.com](https://uptimerobot.com)
2. **Add new monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **URL**: `https://your-app-name.onrender.com`
   - **Monitoring Interval**: `5 minutes`
3. **This will ping your bot every 5 minutes** to keep it awake

---

## **📊 Comparison: Fly.io vs Render**

| Feature | Fly.io | Render |
|---------|--------|--------|
| **Free Tier** | ⚠️ Limited | ✅ 750 hours/month |
| **Stability** | ❌ Crashes frequently | ✅ More stable |
| **Discord Bot Support** | ⚠️ Issues with interactions | ✅ Better support |
| **Deployment** | 🔴 Complex | 🟢 Simple |
| **Error Handling** | ❌ Poor | ✅ Better |
| **Keep-Alive** | ✅ Always-on | ⚠️ Needs UptimeRobot |

---

## **🎯 Migration Benefits**

### **Immediate Benefits:**
- ✅ **No more bot crashes** from Discord API errors
- ✅ **Stable hosting** without machine restarts
- ✅ **No duplicate streams** due to better interaction handling
- ✅ **Simpler deployment** process

### **Long-term Benefits:**
- ✅ **More reliable** for production use
- ✅ **Better error recovery** mechanisms
- ✅ **Easier maintenance** and updates
- ✅ **Cost-effective** free tier

---

## **🚨 Important Notes**

### **Database:**
- ✅ **Keep using Neon** - no changes needed
- ✅ **Same DATABASE_URL** - just update in Render
- ✅ **All your data** will be preserved

### **Bot Token:**
- ✅ **Same Discord token** - no changes needed
- ✅ **Same permissions** - no re-invitation required

### **Commands:**
- ✅ **All slash commands** will work the same
- ✅ **Same functionality** - just more stable

---

## **📋 Pre-Migration Checklist**

- [ ] **Code is ready** (✅ Done - interaction tracking added)
- [ ] **DM functionality removed** (✅ Done)
- [ ] **Error handling improved** (✅ Done)
- [ ] **Express server configured** (✅ Done)
- [ ] **Neon database accessible** (✅ Already working)
- [ ] **Discord bot token ready** (✅ Already working)

---

## **🎉 Post-Migration Steps**

1. **Test all commands** to ensure they work
2. **Set up UptimeRobot** for keep-alive
3. **Monitor logs** for any issues
4. **Update any documentation** with new URL
5. **Delete Fly.io app** to avoid confusion

---

## **💡 Pro Tips**

### **For Better Performance:**
- **Use ephemeral replies** for private commands
- **Monitor Render logs** regularly
- **Set up error notifications** if needed

### **For Maintenance:**
- **Keep Render dashboard** bookmarked
- **Monitor usage** to stay within free limits
- **Update dependencies** regularly

---

## **🆘 Troubleshooting**

### **If Bot Doesn't Start:**
1. Check **environment variables** are set correctly
2. Verify **Discord token** is valid
3. Check **database URL** is accessible
4. Review **Render logs** for errors

### **If Commands Don't Work:**
1. Check **bot permissions** in Discord
2. Verify **slash commands** are registered
3. Check **interaction handling** in logs

### **If Bot Goes to Sleep:**
1. **UptimeRobot** should prevent this
2. **Manual wake-up** by visiting the URL
3. **Check UptimeRobot** is working

---

**Ready to migrate? The bot should be much more stable on Render! ✦**
