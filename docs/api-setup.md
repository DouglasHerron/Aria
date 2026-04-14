# ARIA — API Setup Guide

Step-by-step instructions for getting all credentials before starting development.

**Google sign-in and Gmail/Calendar APIs** always use an OAuth client registered in **Google Cloud / Google API Console**. There is no supported way to skip that for this integration. For a **self-hosted clone**, create **your own** free project and OAuth client so credentials are not tied to anyone else’s account. Do **not** commit real client secrets or `.env.local` to git.

---

## 1. Google Cloud (Gmail + Calendar)

**Time: ~20 minutes**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → name it `aria-dashboard`
3. Enable APIs:
  - Go to **APIs & Services → Library**
  - Search and enable: **Gmail API**
  - Search and enable: **Google Calendar API**
4. Create OAuth credentials:
  - Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
  - Application type: **Web application**
  - Authorized redirect URIs: add `http://localhost:3000/api/auth/callback/google`
  - Copy **Client ID** and **Client Secret** → paste into `.env.local`
5. Configure OAuth consent screen:
  - Go to **APIs & Services → OAuth consent screen**
  - User type: **External** (for testing, add your email as a test user)
  - Scopes to add:
    - `https://www.googleapis.com/auth/gmail.readonly`
    - `https://www.googleapis.com/auth/gmail.send`
    - `https://www.googleapis.com/auth/calendar`

---

## 2. Anthropic (Claude)

**Time: ~5 minutes**

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create account
3. Go to **API Keys → Create Key**
4. Copy the key → paste into `.env.local` as `ANTHROPIC_API_KEY`
5. Set `ANTHROPIC_MODEL=claude-opus-4-6` (or `claude-sonnet-4-6` for faster/cheaper dev)

---

## 3. OpenAI

**Time: ~5 minutes**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Go to **API Keys → Create new secret key**
3. Copy the key → paste into `.env.local` as `OPENAI_API_KEY`
4. Set `OPENAI_MODEL=gpt-4o`

---

## 4. Obsidian Local REST API

**Time: ~10 minutes**

1. Open Obsidian
2. Go to **Settings → Community Plugins → Browse**
3. Search for **"Local REST API"** by Adam Coddington → Install → Enable
4. Go to **Settings → Local REST API**:
  - Note the **API Key** shown → paste into `.env.local` as `OBSIDIAN_REST_API_KEY`
  - Default port is `27123` (matches `.env.example`)
  - Make sure **"Enable"** is toggled on
5. Set `OBSIDIAN_VAULT_PATH` to the **absolute** path of your vault folder (must exist on disk).
6. Verify it's running: `curl http://localhost:27123/vault/ -H "Authorization: Bearer YOUR_KEY"`

> **Note:** The Local REST API plugin must be running (Obsidian must be open) for task/notes features to work in v1.

---

## 5. Apple Calendar (CalDAV)

**Time: ~10 minutes**

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in → **Sign-In and Security → App-Specific Passwords**
3. Click **+** → name it `aria-dashboard`
4. Copy the generated password → paste into `.env.local` as `APPLE_CALDAV_PASSWORD`
5. Set `APPLE_CALDAV_USERNAME` to your Apple ID email address
6. `APPLE_CALDAV_URL` stays as `https://caldav.icloud.com` (no change needed)

---

## 6. NextAuth Secret

Generate a secure random secret:

```bash
openssl rand -base64 32
```

Paste the output into `.env.local` as `NEXTAUTH_SECRET`.

---

## Checklist Before Starting Phase 1

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set
- `NEXTAUTH_SECRET` set
- `NEXTAUTH_URL=http://localhost:3000` set
- `ANTHROPIC_API_KEY` set
- `OPENAI_API_KEY` set
- `OBSIDIAN_VAULT_PATH` set to an **absolute** path that exists on your machine (e.g. `/Users/you/Obsidian` on macOS or `C:\Users\you\Documents\Vault` on Windows)
- `.env.local` created and gitignored

