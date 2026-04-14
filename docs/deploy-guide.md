# ARIA — Test User Deployment Guide

This guide walks you through deploying ARIA to Vercel as a test user. You do not need to be a developer to complete these steps, but you will need accounts on Google, Vercel, and optionally Anthropic.

---

## What you will need before deploying

| Requirement | How to get it |
|---|---|
| **GitHub account** | Sign up at github.com |
| **Vercel account** | Sign up at vercel.com (free) |
| **Google account** | The account you want to use with ARIA |
| **Google OAuth credentials** | Provided by the project owner (see below) |
| **Anthropic API key** | Optional — only needed for AI features |

---

## Step 1: Get your OAuth credentials from the project owner

ARIA uses a shared Google OAuth app. The project owner manages it. You need two things from them:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Contact the project owner and ask for these. They are safe to share privately (do not post them publicly).

---

## Step 2: Get an Anthropic API key (optional)

If you want AI features (email summaries, morning briefing, urgency scoring), sign up at [console.anthropic.com](https://console.anthropic.com) and create an API key.

If you skip this, set `DEMO_MODE=true` and all AI features will run against realistic mock data.

---

## Step 3: Click Deploy to Vercel

Click the **Deploy to Vercel** button in the README. Vercel will fork the repo and ask you to fill in environment variables.

Fill in the following:

| Variable | Value |
|---|---|
| `NEXTAUTH_SECRET` | Any random string (32+ characters). Generate one with `openssl rand -base64 32` or use an online generator. |
| `NEXTAUTH_URL` | Leave blank for now — you will fill this in after deploy. |
| `GOOGLE_CLIENT_ID` | From the project owner (Step 1). |
| `GOOGLE_CLIENT_SECRET` | From the project owner (Step 1). |
| `ANTHROPIC_API_KEY` | Your API key from Step 2, or leave blank if using demo mode. |
| `DEMO_MODE` | `true` to start (recommended). Change to `false` later to connect real data. |

Click **Deploy**. Vercel will build and deploy the app. This takes about 2 minutes.

---

## Step 4: Get your deployment URL and tell the project owner

After deploy, Vercel will show you a URL like:

```
https://aria-dashboard-abc123.vercel.app
```

Copy this URL and send it to the project owner. They need to:
1. Add your URL's callback URI (`https://your-url.vercel.app/api/auth/callback/google`) to the Google OAuth client
2. Add your Google account email as a test user

You cannot sign in until they complete this step.

---

## Step 5: Set NEXTAUTH_URL

Now that you have your Vercel URL, set `NEXTAUTH_URL`:

1. Go to your project on [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Settings → Environment Variables**
3. Find `NEXTAUTH_URL` and set it to `https://your-url.vercel.app`
4. Click **Save**, then go to **Deployments** and click **Redeploy** on the latest deployment

---

## Step 6: Sign in

Once the project owner confirms you have been added, visit your Vercel URL and click **Sign in with Google**.

You will see a Google warning screen that says "Google hasn't verified this app." This is expected for test users — click **Continue** to proceed.

---

## Step 7: Check your configuration

After signing in, visit `/setup` to see a configuration checklist. It shows which environment variables are set and which are missing.

If you want to enable real Gmail and Calendar access:
1. Set `DEMO_MODE` to `false` in Vercel Environment Variables
2. Redeploy
3. Sign out and sign back in to grant the new permissions

---

## Troubleshooting

**"Access denied" error when signing in**
Your Google account hasn't been added as a test user yet. Contact the project owner with your Google account email.

**"OAuth callback failed" error**
Your deployment URL hasn't been registered in the OAuth client. Send your Vercel URL to the project owner.

**Widgets show "Google session expired"**
Sign out (`/api/auth/signout`) and sign back in. Your OAuth token may have expired or the required scopes weren't granted.

**AI features show "No AI API key configured"**
Add your `ANTHROPIC_API_KEY` in Vercel Environment Variables and redeploy. Or set `DEMO_MODE=true` to use mock data instead.

**Something else is wrong**
Visit `/api/health` to see a diagnostic report of which services are configured and which are missing.
