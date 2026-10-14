// Pega aquí los datos de Supabase > Project Settings > API
const SUPABASE_URL = 'https://klfwezsxqfxtlwizglly.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZndlenN4cWZ4dGx3aXpnbGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MzgwOTEsImV4cCI6MjEwNzUxNDA5MX0.okKc3vGE6I9eDRxfN2bz6jpo5fIxhcrhkGsuTyBWOYw';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);