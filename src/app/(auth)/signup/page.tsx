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
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Suspense>
        <SignupForm />
      </Suspense>
    </div>
  );
}
