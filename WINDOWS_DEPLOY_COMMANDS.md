# Windows PowerShell Deployment Commands

Since you have the code as a downloaded folder (not git repo), run these commands **one by one** in PowerShell:

## Step 1: Set API Token

```powershell
$env:CLOUDFLARE_API_TOKEN = 'Igxqh5q9hvRTXvSu6NGxJ1yVu_KMblakHlMlRSJ3'
```

## Step 2: Create D1 Database

```powershell
npx wrangler d1 create publicdomainhunter_db
```

**Copy the `database_id` from the output!** It will look like:
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Step 3: Update wrangler.toml

Open `wrangler.toml` in a text editor and find this section:

```toml
[[d1_databases]]
binding = "DB"
database_name = "publicdomainhunter_db"
database_id = "PLACEHOLDER_DB_ID"
```

Replace `PLACEHOLDER_DB_ID` with your actual database_id from Step 2.

Save the file.

## Step 4: Create Database Tables

First, create `schema.sql` in your project root with this content:

[Download from: https://github.com/amiddlebrook/PublicDomainHunter/blob/claude/account-registration-011CV2biaDJLVN2HZ51fUuXm/schema.sql]

Or run this command to create it:

```powershell
@"
-- Public Domain Hunter - D1 Database Schema
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  full_name TEXT,
  is_active INTEGER DEFAULT 1,
  is_superuser INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
"@ | Out-File -FilePath schema.sql -Encoding UTF8
```

Then run:

```powershell
npx wrangler d1 execute publicdomainhunter_db --file=./schema.sql
```

## Step 5: Build Frontend

```powershell
cd frontend
npm install
npm run cf:build
cd ..
```

## Step 6: Deploy

```powershell
npx wrangler deploy
```

## Done!

After deployment, test at:
- https://publicdomainhunter.averymiddlebrook2014.workers.dev/
- https://publicdomainhunter.averymiddlebrook2014.workers.dev/register
