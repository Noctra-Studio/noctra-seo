import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardRootPage({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const supabase = await createClient();

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirect(`/${locale}/login`);
  }

  // 2. Find user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!userData?.org_id) {
    return redirect(`/${locale}/onboarding`);
  }

  // 3. Find first project in organization
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('org_id', userData.org_id)
    .limit(1)
    .maybeSingle();

  if (project) {
    return redirect(`/${locale}/dashboard/${project.id}`);
  }

  // 4. Fallback to onboarding if no project exists
  return redirect(`/${locale}/onboarding`);
}
