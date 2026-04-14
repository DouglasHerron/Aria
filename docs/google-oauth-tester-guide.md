# Google OAuth — What Test Users Need to Know

ARIA uses Google OAuth to access your Gmail and Google Calendar. This document explains what that means, what you are consenting to, and how to revoke access.

---

## Why you see a "Google hasn't verified this app" warning

ARIA's Google OAuth app is currently in **testing mode**. This is a standard Google limitation for apps that haven't been through Google's formal verification process yet. It does not mean the app is unsafe — it means the app is in active development and limited to approved test users.

When you sign in, you will see a screen like this:

> "Google hasn't verified this app"
> "aria-dashboard hasn't been verified by Google yet."

**To proceed:** click **Advanced** → **Go to aria-dashboard (unsafe)**

This warning will go away once the app completes Google's verification process.

---

## What permissions ARIA requests

ARIA requests the following Google scopes:

| Scope | What it allows |
|---|---|
| `gmail.readonly` | Read your emails and threads |
| `gmail.send` | Send email replies you compose in ARIA |
| `gmail.modify` | Mark emails as read |
| `calendar.readonly` | Read your Google Calendar events |
| `calendar.events` | Create calendar events (quick-add via command palette) |
| `profile`, `email` | Your name and email address for display |

ARIA does **not** have access to Google Drive, Docs, or any other Google services.

---

## What ARIA does with your data

- Email content is read to generate summaries, urgency scores, and draft replies using AI
- Calendar events are read to build a week view and detect scheduling conflicts
- No email content or calendar data is stored persistently outside your browser session
- Draft replies are only sent when you explicitly click **Send**
- `DEMO_MODE=true` disables all write operations (no emails can be sent, no calendar events created)

---

## How to revoke access

To remove ARIA's access to your Google account at any time:

1. Go to [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
2. Find **aria-dashboard** in the list
3. Click **Remove Access**

Your data is not stored by ARIA, so revoking access simply prevents future API calls. No deletion request is needed.

---

## Why you need to be manually added as a test user

Google limits unverified OAuth apps to a maximum of 100 explicitly approved test users. The project owner must add your Google account email to the allowed list in Google Cloud Console before you can sign in. This is a Google requirement, not an ARIA limitation.

If you try to sign in and see an **"Access denied"** error, your email hasn't been added yet. Contact the project owner with your Google account email.
