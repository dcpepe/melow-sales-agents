/**
 * Gmail API Client — OAuth2 auth + read/send/list
 *
 * Tokens stored in Vercel KV. Single-user (shared workspace).
 */

import { google } from "googleapis";
import { kv } from "@vercel/kv";

const GMAIL_TOKEN_KEY = "gmail:tokens";
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/gmail/callback`
  );
}

// --- Token Management ---

export async function getStoredTokens(): Promise<Record<string, unknown> | null> {
  return kv.get(GMAIL_TOKEN_KEY);
}

export async function storeTokens(tokens: Record<string, unknown>): Promise<void> {
  await kv.set(GMAIL_TOKEN_KEY, tokens);
}

export async function clearTokens(): Promise<void> {
  await kv.del(GMAIL_TOKEN_KEY);
}

export async function isConnected(): Promise<boolean> {
  const tokens = await getStoredTokens();
  return !!tokens;
}

// --- Auth Flow ---

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GMAIL_SCOPES,
    prompt: "consent",
  });
}

export async function handleCallback(code: string): Promise<void> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  await storeTokens(tokens as Record<string, unknown>);
}

// --- Authenticated Client ---

async function getAuthenticatedClient() {
  const tokens = await getStoredTokens();
  if (!tokens) throw new Error("Gmail not connected");

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens as { access_token?: string; refresh_token?: string });

  // Handle token refresh
  oauth2Client.on("tokens", async (newTokens) => {
    const existing = await getStoredTokens();
    await storeTokens({ ...existing, ...newTokens });
  });

  return oauth2Client;
}

// --- Gmail Operations ---

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body: string;
  labels: string[];
}

export async function listMessages(query?: string, maxResults = 20): Promise<GmailMessage[]> {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.list({
    userId: "me",
    q: query || "",
    maxResults,
  });

  if (!res.data.messages) return [];

  const messages: GmailMessage[] = [];
  for (const msg of res.data.messages) {
    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      // Extract body
      let body = "";
      const payload = detail.data.payload;
      if (payload?.body?.data) {
        body = Buffer.from(payload.body.data, "base64").toString("utf-8");
      } else if (payload?.parts) {
        const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        }
      }

      messages.push({
        id: msg.id!,
        threadId: msg.threadId!,
        subject: getHeader("Subject"),
        from: getHeader("From"),
        to: getHeader("To"),
        date: getHeader("Date"),
        snippet: detail.data.snippet || "",
        body,
        labels: detail.data.labelIds || [],
      });
    } catch {
      // Skip messages that fail to load
    }
  }

  return messages;
}

export async function getMessage(messageId: string): Promise<GmailMessage | null> {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: "v1", auth });

  try {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const headers = detail.data.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

    let body = "";
    const payload = detail.data.payload;
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload?.parts) {
      const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    return {
      id: messageId,
      threadId: detail.data.threadId!,
      subject: getHeader("Subject"),
      from: getHeader("From"),
      to: getHeader("To"),
      date: getHeader("Date"),
      snippet: detail.data.snippet || "",
      body,
      labels: detail.data.labelIds || [],
    };
  } catch {
    return null;
  }
}

export async function sendEmail(to: string, subject: string, body: string, threadId?: string): Promise<string> {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: "v1", auth });

  // Get sender email
  const profile = await gmail.users.getProfile({ userId: "me" });
  const from = profile.data.emailAddress || "";

  const raw = Buffer.from(
    `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
  ).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: threadId || undefined,
    },
  });

  return res.data.id || "";
}

export async function getProfile(): Promise<{ email: string; messagesTotal: number }> {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: "v1", auth });
  const profile = await gmail.users.getProfile({ userId: "me" });
  return {
    email: profile.data.emailAddress || "",
    messagesTotal: profile.data.messagesTotal || 0,
  };
}
