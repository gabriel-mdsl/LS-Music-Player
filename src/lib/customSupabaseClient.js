import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywmoawzlzoazoexzhlqv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bW9hd3psem9hem9leHpobHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDAyMjEsImV4cCI6MjA4MjE3NjIyMX0.oCnmDgSX3F-IOiVebduJ2VIyYawR1Hn7dgtSyrpQpKw';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
