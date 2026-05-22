import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminShell } from "./_components/AdminShell";

export const metadata = { title: "Admin — AutoShop Pro" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single()) as {
    data: { is_admin: boolean; full_name: string | null } | null;
  };

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <AdminShell adminName={profile.full_name ?? user.email ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
