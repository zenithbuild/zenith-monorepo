# Discord Webhook Setup Guide

This guide will help you set up GitHub to automatically post formatted issue updates to your Discord server.

## Quick Setup (Recommended - GitHub Actions)

**Use GitHub Actions for properly formatted Discord messages!**

```bash
./scripts/setupDiscordGitHubAction.sh
```

This will:
1. Read your Discord webhook URL from `.env` (or prompt you)
2. Set it as a GitHub secret
3. Configure GitHub Actions to send beautifully formatted messages to Discord

**To get your Discord webhook URL:**
1. Go to your Discord server
2. Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Copy the webhook URL

**Make sure your `.env` file has:**
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

That's it! When issues are created or updated, GitHub Actions will automatically send formatted messages with embeds, colors, and all issue details to your Discord channel.

## Advanced: Better Formatting (Optional)

If you want prettier formatted messages with embeds, colors, and better layout, you can use the webhook proxy server. This is **optional** - the direct webhook above works fine!

## Webhook Proxy (Optional - For Better Formatting)

**You don't need this!** The direct webhook above works fine. Only use this if you want prettier formatted messages with embeds, colors, and better layout.

### Step 1: Get Discord Webhook URL

1. Go to your Discord server
2. Server Settings → Integrations → Webhooks
3. Click "New Webhook"
4. Copy the webhook URL

### Step 2: Run the Proxy Server

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"
bun scripts/webhook-proxy.ts
```

Or add it to your environment:
```bash
# Add to ~/.zshrc or ~/.bashrc
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"
```

### Step 3: Expose the Server

You need to make your local server accessible to GitHub. Options:

**A. Use ngrok (easiest for testing):**
```bash
# Install ngrok: https://ngrok.com/
ngrok http 3001
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**B. Deploy to a server:**
- Deploy the proxy server to a cloud service (Railway, Render, Fly.io, etc.)
- Make sure it's accessible via HTTPS

### Step 4: Configure GitHub Webhook

1. Go to: `https://github.com/YOUR_USERNAME/zenith/settings/hooks`
2. Click "Add webhook"
3. **Payload URL**: `https://your-server.com/webhook` (or your ngrok URL)
4. **Content type**: `application/json`
5. **Which events**: Select "Let me select individual events"
6. Check:
   - ✅ Issues
   - ✅ Issue comment (optional)
7. Click "Add webhook"

### Step 5: Test

Create a test issue or run:
```bash
./scripts/uploadIssues.sh
```

You should see formatted messages appear in your Discord channel!

## What Gets Posted

When an issue is created, edited, or closed, Discord will receive:

- 📝 Issue title
- 📋 Issue description (truncated if too long)
- 🏷️ Labels
- 🔗 Link to the issue
- 👤 Author information
- 📊 Issue state (open/closed)

## Troubleshooting

**Webhook not working?**
- Check that your server is running and accessible
- Verify the Discord webhook URL is correct
- Check GitHub webhook delivery logs: Settings → Webhooks → Your webhook → Recent Deliveries

**Messages not formatted nicely?**
- Make sure you're using Option 2 (webhook proxy)
- Check server logs for errors

**Server not accessible?**
- Make sure port 3001 is open
- If using ngrok, restart it and update the GitHub webhook URL

