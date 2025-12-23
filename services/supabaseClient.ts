
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ajecwczcrpylgnfxbbll.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZWN3Y3pjcnB5bGduZnhiYmxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjA1NDEsImV4cCI6MjA4MjAzNjU0MX0.qefWsG_3IrQM-Fvlu3PetRN6az8apLjC7xdYq65v5ks';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
