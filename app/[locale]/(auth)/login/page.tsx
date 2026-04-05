import { AuthForm } from '@/components/auth/AuthForm';
import { DashboardPreview } from '@/components/auth/DashboardPreview';
import { signIn } from '@/lib/supabase/actions';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params;

  async function handleAction(formData: FormData) {
    'use server';
    return signIn(formData, locale);
  }

  return (
    <div className="flex min-h-screen bg-[#050505] overflow-hidden">
      {/* Left side: Auth Form */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981]/10 blur-[120px] rounded-full" />
        </div>
        <AuthForm type="login" locale={locale} onSubmit={handleAction} />
      </div>

      {/* Right side: Dashboard Preview */}
      <div className="hidden lg:flex flex-1 border-l border-white/[0.05]">
        <DashboardPreview />
      </div>
    </div>
  );
}
