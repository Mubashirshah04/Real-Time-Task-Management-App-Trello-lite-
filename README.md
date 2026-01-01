
# Trello-Lite Task Manager

## 🚀 DEPLOYMENT & DATABASE SYNC

### 1. Fix User-Specific Boards (REQUIRED)
To ensure every user sees only their own boards, you **MUST** run this SQL in your Supabase SQL Editor:

```sql
-- Add user_id column to boards table
ALTER TABLE boards ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create an index for faster filtering
CREATE INDEX IF NOT EXISTS boards_user_id_idx ON boards(user_id);

-- Optional: If you want to enable Row Level Security (RLS) properly
-- but for now we filter in the application layer for simplicity.
```

### 2. Fix Cascading Deletes (Nuclear Fix)
If deleting boards doesn't work, run this to ensure related data is cleaned up:

```sql
ALTER TABLE IF EXISTS lists DROP CONSTRAINT IF EXISTS lists_board_id_fkey;
ALTER TABLE lists 
ADD CONSTRAINT lists_board_id_fkey 
FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS tasks DROP CONSTRAINT IF EXISTS tasks_list_id_fkey;
ALTER TABLE tasks 
ADD CONSTRAINT tasks_list_id_fkey 
FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE;

-- Ensure Realtime works
ALTER TABLE boards REPLICA IDENTITY FULL;
ALTER TABLE lists REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
```

### Why the Black Screen happened:
Standard static hosts like Netlify don't automatically know that `index.tsx` is the entry point. We explicitly added the script tag to `index.html` to tell the browser (or your transpiler layer) exactly where to start.

### Why individual boards?
We generate a unique ID for every new visitor and store it in their browser's `localStorage`. This ID is used to filter the boards in Supabase so users don't see each other's data.
