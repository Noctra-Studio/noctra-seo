import { AuthForm } from '@/components/auth/AuthForm';
import { signUp } from '@/lib/supabase/actions';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;

  async function handleAction(formData: FormData) {
    'use server';
    return signUp(formData, locale);
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6366f1]/5 blur-[120px] rounded-full" />
      </div>

      <AuthForm type="register" locale={locale} onSubmit={handleAction} />
    </div>
  );
}
