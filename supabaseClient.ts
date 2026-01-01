
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szmhibfjcxzmtehugbji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bWhpYmZqY3h6bXRlaHVnYmppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNjAyNDMsImV4cCI6MjA4MjgzNjI0M30.KelAnUn3IeT3UH9zI5bM7qQYq-MR-TrEBmQAczH5lNI';

export const supabase = createClient(supabaseUrl, supabaseKey);
