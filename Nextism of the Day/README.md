# Nextism of the Day

A scheduled Claude agent that selects a daily nextism from NTN's Instagram and Notion daily news, DMs Rachel a preview at 8am, and automatically updates her Gmail signature so every client email that day carries it.

## What It Does

Runs every weekday at 8am EDT. On each run it:

1. Queries the **Team Context & Daily News** Notion database for recent entries containing nextism-style phrases
2. Fetches the **NTN Instagram** page and extracts quotable phrases from recent captions (falls back to Notion-only if Instagram is unavailable)
3. Selects ONE nextism for the day — short, opinionated, distinctly NTN
4. DMs Rachel via Baxter with a preview before the signature is updated
5. Updates Rachel's Gmail signature to include the nextism at the bottom, wrapped in HTML comment markers so it can be cleanly replaced each day

## What a Nextism Looks Like

A short, declarative, NTN-flavored phrase — under 15 words, specific, and opinionated about the future of work. Examples of the format:

> The future of work isn't a destination. It's a daily practice.

> AI doesn't replace judgment. It makes judgment more important.

## Gmail Signature Format

The nextism is appended to the existing signature as:

```
[existing signature]

💡 [nextism text]
```

The block is wrapped in `<!--NTN-NEXTISM-START-->` / `<!--NTN-NEXTISM-END-->` HTML comments so each run cleanly replaces the previous day's nextism without touching the rest of the signature.

## Setup Required (One-Time)

The Gmail signature update requires Google OAuth credentials with the `gmail.settings.basic` scope. See **Gmail OAuth Setup** below.

Until credentials are configured, the routine still runs and DMs Rachel the daily nextism — just without the signature update.

## Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a new project (or use an existing one)
2. Enable the **Gmail API** for the project
3. Go to **APIs & Services → Credentials** → Create OAuth 2.0 Client ID (Desktop app)
4. Download the credentials JSON — note `client_id` and `client_secret`
5. Run this command locally to get a refresh token with the right scope:
   ```
   ! python3 -c "
   from google_auth_oauthlib.flow import InstalledAppFlow
   flow = InstalledAppFlow.from_client_secrets_file('credentials.json', ['https://www.googleapis.com/auth/gmail.settings.basic'])
   creds = flow.run_local_server()
   print('REFRESH TOKEN:', creds.refresh_token)
   "
   ```
6. Add three env vars to the NTN environment (`env_0145xrZorPfjnJbu1KotxkRn`) via [claude.ai/code/routines](https://claude.ai/code/routines):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`

## Schedule

- **Automatic:** Weekdays at 8am EDT

## Routine Configuration

| Field | Value |
| --- | --- |
| Routine ID | `trig_014Evm1wx1KDgqZqatmg2FNM` |
| Model | claude-sonnet-4-6 |
| Schedule | `0 12 * * 1-5` (8am EDT weekdays) |
| MCP Connections | Notion |
| Slack Sender | Baxter (`$BAXTER_TOKEN`) |
| Notion DB | Team Context & Daily News (`0369f0d1d72341159cec834312bc5fdb`) |
| Instagram | @nowtonext (WebFetch, best-effort) |

## Recreating This Routine

1. Go to [claude.ai/code/routines](https://claude.ai/code/routines) and create a new routine
2. Set the schedule to `0 12 * * 1-5`
3. Attach the **Notion** MCP connector
4. Ensure `BAXTER_TOKEN` is set in the environment (existing)
5. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` for Gmail signature updates (see Setup above)
6. Paste the prompt from `nextism-of-the-day-baxter.md` as the agent instructions
