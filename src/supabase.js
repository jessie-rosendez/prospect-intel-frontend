import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnttyawxsegeldlkyysi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudHR5YXd4c2VnZWxkbGt5eXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODMxNTYsImV4cCI6MjA4ODk1OTE1Nn0.p59Tm0Mn_cVU76gTdpBuO712XJve53ppkuYyxDkBngE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
