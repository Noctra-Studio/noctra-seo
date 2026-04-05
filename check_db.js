const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jaikgfrfgriabixxzduk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaWtnZnJmZ3JpYWJpeHh6ZHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTMzODU4NSwiZXhwIjoyMDkwOTE0NTg1fQ.MIAMA1O8Ar7zQDjyfvRJfPc6fouodg9JwYXV9ZxqljM'
);

async function check() {
  const { data, error } = await supabase.from('domains').select('hostname, site_id, tracker_installed, first_pageview_at');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

check();
