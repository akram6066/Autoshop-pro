import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import LoginForm from "./components/LoginForm";

export default async function LoginPage() {
  // Redirect authenticated users — already logged-in users visiting /login
  // should land on the app, not the login form.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
