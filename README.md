# Trello-Lite Task Manager

## 🚨 NUCLEAR DELETE FIX (REQUIRED)

If deleting a Board or Card is not working, it is 99% a Database Constraint issue. You **MUST** run this specific SQL to fix Foreign Keys and RLS:

```sql
-- 1. FIX CASCADING DELETES (Critical for Board/Column Deletion)
ALTER TABLE IF EXISTS lists DROP CONSTRAINT IF EXISTS lists_board_id_fkey;
ALTER TABLE lists 
ADD CONSTRAINT lists_board_id_fkey 
FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS tasks DROP CONSTRAINT IF EXISTS tasks_list_id_fkey;
ALTER TABLE tasks 
ADD CONSTRAINT tasks_list_id_fkey 
FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE;

-- 2. RESET RLS FOR ALL OPERATIONS
DROP POLICY IF EXISTS "Allow All" ON boards;
DROP POLICY IF EXISTS "Allow All" ON lists;
DROP POLICY IF EXISTS "Allow All" ON tasks;

CREATE POLICY "Allow All" ON boards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All" ON tasks FOR ALL USING (true) WITH CHECK (true);

-- 3. ENSURE REPLICA IDENTITY IS FULL FOR REALTIME
ALTER TABLE boards REPLICA IDENTITY FULL;
ALTER TABLE lists REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
```

### Why this works:
- **ON DELETE CASCADE**: Tells Postgres that if a board is deleted, automatically delete all its lists and tasks. Without this, Postgres blocks the delete to "protect" the data.
- **REPLICA IDENTITY FULL**: Tells Supabase to send the *full* old data in a DELETE event, so the UI knows exactly which ID was removed.
