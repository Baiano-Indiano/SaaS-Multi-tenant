/**
 * Payload Transformer
 * 
 * Converts raw system events into platform-specific rich messages
 * for Slack (Block Kit) and Discord (Embeds).
 */


interface IntegrationPayload extends Record<string, unknown> {
  name?: string;
  email?: string;
  role?: string;
  userName?: string;
  actorName?: string;
  actorEmail?: string;
  actorAvatar?: string;
  targetName?: string;
  targetEmail?: string;
  oldRole?: string;
  newRole?: string;
  projectName?: string;
  details?: string;
}

type EventPayload = IntegrationPayload;

interface SlackBlock {
  type: "header" | "section" | "context" | "divider";
  text?: { type: "plain_text" | "mrkdwn"; text: string };
  fields?: { type: "mrkdwn"; text: string }[];
  elements?: { type: "mrkdwn"; text: string }[];
  accessory?: {
    type: string;
    image_url?: string;
    alt_text?: string;
  };
}

export function transformToSlack(event: string, payload: EventPayload) {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: getEventEmoji(event) + " " + getEventTitle(event),
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: getEventDescription(event, payload)
      }
    }
  ];

  // Add event-specific fields
  const fields: { type: "mrkdwn"; text: string }[] = [];

  if (event.startsWith("project.")) {
    fields.push({ type: "mrkdwn", text: `*Project:* ${payload.name || payload.projectName}` });
    fields.push({ type: "mrkdwn", text: `*Actor:* ${payload.actorName || "System"}` });
  } else if (event === "member.invited") {
    fields.push({ type: "mrkdwn", text: `*Invited:* ${payload.email || payload.targetEmail}` });
    fields.push({ type: "mrkdwn", text: `*Role:* ${payload.role || "Member"}` });
    fields.push({ type: "mrkdwn", text: `*By:* ${payload.actorName}` });
  } else if (event === "organization.invitation_accepted") {
    fields.push({ type: "mrkdwn", text: `*Member:* ${payload.userName || payload.actorName}` });
    fields.push({ type: "mrkdwn", text: `*Email:* ${payload.email || payload.actorEmail}` });
  } else if (event === "role.updated") {
    fields.push({ type: "mrkdwn", text: `*Member:* ${payload.targetName}` });
    fields.push({ type: "mrkdwn", text: `*New Role:* ${payload.newRole || payload.role}` });
    fields.push({ type: "mrkdwn", text: `*Updated By:* ${payload.actorName}` });
  } else if (event === "member.removed") {
    fields.push({ type: "mrkdwn", text: `*Member:* ${payload.targetName || payload.name || "Unknown"}` });
    fields.push({ type: "mrkdwn", text: `*Actor:* ${payload.actorName}` });
  }

  if (fields.length > 0) {
    blocks.push({
      type: "section",
      fields
    });
  }

  if (payload.details) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Details:*\n${payload.details}`
      }
    });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Sent from *Gravity SaaS* • ${new Date().toLocaleString()}`
      }
    ]
  });

  return { blocks };
}

export function transformToDiscord(event: string, payload: EventPayload) {
  const embed = {
    title: getEventEmoji(event) + " " + getEventTitle(event),
    description: getEventDescription(event, payload),
    color: getEventColor(event),
    timestamp: new Date().toISOString(),
    footer: {
      text: "Gravity SaaS",
    },
    fields: [] as { name: string; value: string; inline?: boolean }[]
  };

  if (event.startsWith("project.")) {
    embed.fields.push(
      { name: "Project", value: (payload.name || payload.projectName) as string, inline: true },
      { name: "Actor", value: (payload.actorName || "System") as string, inline: true }
    );
  } else if (event === "member.invited") {
    embed.fields.push(
      { name: "Invited", value: (payload.email || payload.targetEmail) as string, inline: true },
      { name: "Role", value: (payload.role || "Member") as string, inline: true },
      { name: "By", value: payload.actorName as string, inline: true }
    );
  } else if (event === "organization.invitation_accepted") {
    embed.fields.push(
      { name: "Member", value: (payload.userName || payload.actorName) as string, inline: true },
      { name: "Email", value: (payload.email || payload.actorEmail) as string, inline: true }
    );
  } else if (event === "role.updated") {
    embed.fields.push(
      { name: "Member", value: payload.targetName as string, inline: true },
      { name: "New Role", value: (payload.newRole || payload.role) as string, inline: true },
      { name: "Updated By", value: payload.actorName as string, inline: true }
    );
  } else if (event === "member.removed") {
    embed.fields.push(
      { name: "Member", value: (payload.targetName || payload.name || "Unknown") as string, inline: true },
      { name: "Actor", value: payload.actorName as string, inline: true }
    );
  }

  if (payload.details) {
    embed.fields.push({ name: "Details", value: payload.details as string, inline: false });
  }

  return { embeds: [embed] };
}

// Helpers

function getEventTitle(event: string): string {
  const titles: Record<string, string> = {
    "project.created": "New Project Created",
    "project.deleted": "Project Removed",
    "member.invited": "Team Member Invited",
    "member.removed": "Team Member Removed",
    "organization.invitation_accepted": "Member Joined Team",
    "role.updated": "Permissions Changed",
  };
  return (titles[event] as string) || "System Event";
}

function getEventEmoji(event: string): string {
  const emojis: Record<string, string> = {
    "project.created": "🚀",
    "project.deleted": "🗑️",
    "member.invited": "✉️",
    "member.removed": "👋",
    "organization.invitation_accepted": "🤝",
    "role.updated": "🔐",
  };
  return (emojis[event] as string) || "🔔";
}

function getEventDescription(event: string, payload: EventPayload): string {
  switch (event) {
    case "project.created":
      return `A new project "**${payload.name || payload.projectName}**" has been added to your organization.`;
    case "project.deleted":
      return `Project "**${payload.name || payload.projectName || "Unknown"}**" was permanently deleted.`;
    case "member.invited":
      return `An invitation has been sent to **${payload.email || payload.targetEmail}** to join the team.`;
    case "member.removed":
      return `Member **${payload.targetName || payload.name || "Unknown"}** was removed from the organization.`;
    case "organization.invitation_accepted":
      return `**${payload.userName || payload.actorName || "A new member"}** just joined the organization.`;
    case "role.updated":
      return `User permissions for **${payload.targetName || "a member"}** were modified to **${payload.newRole || payload.role}**.`;
    default:
      return "Something happened in your organization.";
  }
}

function getEventColor(event: string): number {
  const colors: Record<string, number> = {
    "project.created": 0x3b82f6, // Blue
    "project.deleted": 0xef4444, // Red
    "member.invited": 0xf59e0b, // Orange
    "member.removed": 0x6b7280, // Gray
    "organization.invitation_accepted": 0x10b981, // Green
    "role.updated": 0x8b5cf6, // Purple
  };
  return (colors[event] as number) || 0x6b7280; // Gray
}


