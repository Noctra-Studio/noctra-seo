const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jaikgfrfgriabixxzduk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaWtnZnJmZ3JpYWJpeHh6ZHVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTMzODU4NSwiZXhwIjoyMDkwOTE0NTg1fQ.MIAMA1O8Ar7zQDjyfvRJfPc6fouodg9JwYXV9ZxqljM'
);

async function check() {
  // First get domain id
  const { data: domains } = await supabase.from('domains').select('id, hostname').eq('hostname', 'noctra.studio').single();
  if (!domains) {
    console.log('No domain found');
    process.exit(1);
  }

  const domainId = domains.id;
  const { data: pvs, count } = await supabase.from('pageviews').select('*', { count: 'exact' }).eq('domain_id', domainId);
  
  console.log(`Found ${count} pageviews for noctra.studio (${domainId})`);
  if (pvs && pvs.length > 0) {
    console.log('Latest Pageview:', pvs[0].visited_at);
  }
  process.exit(0);
}

check();
