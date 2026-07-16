import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import SignupForm from "./components/SignupForm";

export default async function SignupPage() {
  // Redirect authenticated users — they have no reason to see the signup form.
  // After email confirmation the callback sets a session; on the next visit to
  // /signup the user is already logged in and gets sent straight to /dashboard
  // (which the layout's init() redirects to /setup for new users with no shop).
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex bg-[var(--color-surface-1)] text-[var(--color-ink-primary)] selection:bg-brand-500/30 selection:text-brand-600 dark:selection:text-brand-200">
      {/* Left Pane - Visuals (Desktop Only) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-[var(--color-surface-2)] border-r border-[var(--color-border-subtle)] overflow-hidden">
        {/* Aurora Mesh Gradient */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[30%] right-[20%] w-[500px] h-[500px] bg-brand-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-1000"></div>
          <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] bg-purple-600/10 blur-[130px] rounded-full mix-blend-screen"></div>
        </div>
        
        {/* Decorative Grid */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        ></div>

        <div className="relative z-10 p-12 max-w-lg text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-0)]/50 border border-[var(--color-border-subtle)] text-sm font-medium text-[var(--color-ink-secondary)] mb-8 backdrop-blur-md">
            <span className="text-brand-400">★</span>
            Top-rated Auto Shop Software
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[var(--color-ink-primary)] mb-6 leading-tight">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-purple-400">speed</span> and precision.
          </h2>
          <p className="text-lg text-[var(--color-ink-secondary)] font-medium">
            Everything you need to scale your business, manage inventory, and increase sales—all in one place.
          </p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[420px]">
          <Suspense fallback={<div className="h-[400px]" />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
