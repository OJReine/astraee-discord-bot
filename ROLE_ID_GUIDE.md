# ✦ Role ID Guide for Discord Bot ✦

## **How to Get Role IDs in Discord**

### **Method 1: Developer Mode (Recommended)**

#### **Step 1: Enable Developer Mode**
1. Open Discord
2. Go to **User Settings** (gear icon)
3. Go to **Advanced** section
4. Toggle **Developer Mode** to **ON**

#### **Step 2: Get Role ID**
1. Right-click on any role in your server
2. Select **Copy ID**
3. The role ID will be copied to your clipboard
4. It looks like: `1234567890123456789`

### **Method 2: Using Discord API**

#### **Step 1: Enable Developer Mode**
Same as Method 1

#### **Step 2: Get Role ID**
1. Go to your server
2. Right-click on the role name in the member list
3. Select **Copy ID**

---

## **How to Use Role IDs in Your Bot Code**

### **Pinging Roles in Messages**

```javascript
// Ping a role in a message
const adminRoleId = '1234567890123456789';
const message = `<@&${adminRoleId}> Please check this stream!`;

// Send message with role ping
await channel.send(message);
```

### **Checking if User Has Role**

```javascript
// Check if user has admin role
const adminRoleId = '1234567890123456789';
const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);

if (hasAdminRole) {
    // User has admin role
    console.log('User is an admin');
} else {
    // User doesn't have admin role
    console.log('User is not an admin');
}
```

### **Adding Role to User**

```javascript
// Add role to user
const adminRoleId = '1234567890123456789';
const member = interaction.member;

try {
    await member.roles.add(adminRoleId);
    console.log('Role added successfully');
} catch (error) {
    console.error('Error adding role:', error);
}
```

### **Removing Role from User**

```javascript
// Remove role from user
const adminRoleId = '1234567890123456789';
const member = interaction.member;

try {
    await member.roles.remove(adminRoleId);
    console.log('Role removed successfully');
} catch (error) {
    console.error('Error removing role:', error);
}
```

---

## **Example: Admin Role Configuration**

### **Step 1: Create Admin Role**
1. Go to **Server Settings** → **Roles**
2. Create a new role called "Admin" or "Stream Manager"
3. Set appropriate permissions
4. Copy the role ID

### **Step 2: Add to Bot Code**

```javascript
// Configuration object
const config = {
    adminRoleId: '1234567890123456789', // Replace with your admin role ID
    moderatorRoleId: '9876543210987654321', // Replace with your moderator role ID
};

// Check permissions
function hasAdminPermission(member) {
    return member.roles.cache.has(config.adminRoleId) || 
           member.permissions.has(PermissionFlagsBits.ManageMessages);
}

// Use in command handler
if (!hasAdminPermission(interaction.member)) {
    const embed = createAstraeeEmbed(
        'Permission Denied',
        'You need admin permissions to use this command.',
        '#E74C3C'
    );
    return interaction.reply({ embeds: [embed], ephemeral: true });
}
```

---

## **Common Role IDs for IMVU Servers**

### **Typical Role Structure:**
- **Owner**: Server owner
- **Admin**: Full administrative access
- **Moderator**: Stream management permissions
- **Model**: Regular model role
- **Creator**: Content creator role

### **Example Configuration:**

```javascript
const serverRoles = {
    owner: '1234567890123456789',
    admin: '2345678901234567890',
    moderator: '3456789012345678901',
    model: '4567890123456789012',
    creator: '5678901234567890123'
};
```

---

## **Security Best Practices**

### **1. Never Hardcode Role IDs**
```javascript
// ❌ Bad - hardcoded
const adminRoleId = '1234567890123456789';

// ✅ Good - environment variable
const adminRoleId = process.env.ADMIN_ROLE_ID;
```

### **2. Use Environment Variables**
```env
# .env file
ADMIN_ROLE_ID=1234567890123456789
MODERATOR_ROLE_ID=9876543210987654321
MODEL_ROLE_ID=1111111111111111111
```

### **3. Validate Role IDs**
```javascript
// Check if role exists
function isValidRoleId(guild, roleId) {
    return guild.roles.cache.has(roleId);
}

// Use in code
if (!isValidRoleId(interaction.guild, adminRoleId)) {
    console.error('Admin role ID is invalid');
    return;
}
```

---

## **Troubleshooting**

### **Role ID Not Working?**
1. ✅ Check if Developer Mode is enabled
2. ✅ Verify the role ID is correct
3. ✅ Ensure the bot has permission to see the role
4. ✅ Check if the role still exists

### **Bot Can't Ping Role?**
1. ✅ Ensure bot has "Mention Everyone" permission
2. ✅ Check if role is mentionable
3. ✅ Verify bot has "Send Messages" permission

### **Permission Errors?**
1. ✅ Check bot's role hierarchy
2. ✅ Ensure bot role is above target role
3. ✅ Verify bot has "Manage Roles" permission

---

## **Quick Setup for Astraee Bot**

### **Step 1: Get Your Role IDs**
1. Enable Developer Mode
2. Right-click on your admin role
3. Copy ID
4. Repeat for other roles

### **Step 2: Update Bot Code**
```javascript
// Add to your index.js
const ADMIN_ROLE_ID = 'YOUR_ADMIN_ROLE_ID_HERE';
const MODERATOR_ROLE_ID = 'YOUR_MODERATOR_ROLE_ID_HERE';

// Use in streamcreate command
if (creator) {
    responseText += `<@${creator.id}> `;
} else {
    // Ping admin role if no creator specified
    responseText += `<@&${ADMIN_ROLE_ID}> `;
}
responseText += `<@${interaction.user.id}>`;
```

### **Step 3: Test**
1. Use `/streamcreate` command
2. Check if admin role gets pinged
3. Verify permissions work correctly

---

**Ready to implement role-based pinging in your Astraee bot!** ✦
