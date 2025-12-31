#!/usr/bin/env bun
/**
 * GitHub to Discord Webhook Proxy
 * 
 * This server receives GitHub webhook events and formats them for Discord.
 * 
 * Usage:
 *   1. Add DISCORD_WEBHOOK_URL to .env file (or export as environment variable)
 *   2. Run: bun scripts/webhook-proxy.ts
 *   3. Point GitHub webhook to: http://your-server:3001/webhook
 * 
 * Note: Bun automatically loads .env files from the project root
 */

import { serve } from "bun";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!DISCORD_WEBHOOK_URL) {
  console.error("❌ Error: DISCORD_WEBHOOK_URL environment variable is required");
  console.error("   Set it in .env file: DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'");
  console.error("   Or export it: export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'");
  process.exit(1);
}

const PORT = process.env.PORT || 3001;

interface GitHubIssueEvent {
  action: string;
  issue: {
    number: number;
    title: string;
    body: string;
    html_url: string;
    state: string;
    labels: Array<{ name: string; color: string }>;
    user: {
      login: string;
      avatar_url: string;
    };
  };
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
}

function formatIssueForDiscord(event: GitHubIssueEvent): any {
  const { issue, repository, action } = event;
  
  // Determine color based on action
  let color = 0x3498db; // Blue (default)
  if (action === "opened") color = 0x2ecc71; // Green
  if (action === "closed") color = 0xe74c3c; // Red
  if (action === "reopened") color = 0xf39c12; // Orange
  
  // Format labels
  const labels = issue.labels.map(l => `\`${l.name}\``).join(" ") || "*No labels*";
  
  // Truncate body if too long
  let description = issue.body || "*No description*";
  if (description.length > 1000) {
    description = description.substring(0, 1000) + "...";
  }
  
  // Format action text
  const actionText: Record<string, string> = {
    opened: "📝 New Issue Created",
    closed: "✅ Issue Closed",
    reopened: "🔄 Issue Reopened",
    edited: "✏️ Issue Edited",
    assigned: "👤 Issue Assigned",
    unassigned: "👤 Issue Unassigned",
    labeled: "🏷️ Label Added",
    unlabeled: "🏷️ Label Removed",
  };
  
  const title = actionText[action] || `📋 Issue ${action}`;
  
  return {
    embeds: [
      {
        title: title,
        description: `**${issue.title}**`,
        url: issue.html_url,
        color: color,
        fields: [
          {
            name: "Issue #",
            value: `#${issue.number}`,
            inline: true,
          },
          {
            name: "State",
            value: issue.state,
            inline: true,
          },
          {
            name: "Labels",
            value: labels,
            inline: false,
          },
          {
            name: "Description",
            value: description,
            inline: false,
          },
        ],
        author: {
          name: issue.user.login,
          icon_url: issue.user.avatar_url,
        },
        footer: {
          text: repository.full_name,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function sendToDiscord(payload: any): Promise<Response> {
  const response = await fetch(DISCORD_WEBHOOK_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${text}`);
  }
  
  return response;
}

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Webhook endpoint
    if (url.pathname === "/webhook" && req.method === "POST") {
      try {
        const githubEvent = req.headers.get("x-github-event");
        const signature = req.headers.get("x-hub-signature-256");
        
        if (!githubEvent) {
          return new Response(
            JSON.stringify({ error: "Missing x-github-event header" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Only process issue events
        if (githubEvent !== "issues" && githubEvent !== "issue_comment") {
          return new Response(
            JSON.stringify({ message: `Ignoring event: ${githubEvent}` }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        
        const body = await req.json();
        
        // Format for Discord
        let discordPayload;
        if (githubEvent === "issues") {
          discordPayload = formatIssueForDiscord(body as GitHubIssueEvent);
        } else {
          // Handle issue comments if needed
          return new Response(
            JSON.stringify({ message: "Issue comments not yet implemented" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Send to Discord
        await sendToDiscord(discordPayload);
        
        console.log(`✅ Sent ${githubEvent} event to Discord: ${body.issue?.title || "N/A"}`);
        
        return new Response(
          JSON.stringify({ success: true, event: githubEvent }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (error: any) {
        console.error("❌ Error processing webhook:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 GitHub to Discord webhook proxy running on port ${PORT}`);
console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
console.log(`💚 Health check: http://localhost:${PORT}/health`);
console.log(`\n⚠️  Make sure to set DISCORD_WEBHOOK_URL environment variable`);

