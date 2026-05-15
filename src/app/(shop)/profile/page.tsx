"use client";

import {
  useAuthStore,
  selectRole,
  selectProfile,
  selectUser,
} from "@/stores/authStore";
import { ProfileForm } from "./_components/ProfileForm";
import { SecurityForm } from "./_components/SecurityForm";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden mb-6 animate-fade-in-up">
      <div
        className="px-6 py-4"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h2 className="font-medium">{title}</h2>
        {description && (
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {description}
          </p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const role = useAuthStore(selectRole);
  const profile = useAuthStore(selectProfile);
  const user = useAuthStore(selectUser);

  if (!profile || !user) {
    return (
      <div className="max-w-2xl animate-fade-in">
        <div
          className="h-8 w-48 mb-2 rounded animate-pulse-soft"
          style={{ background: "var(--color-surface-2)" }}
        />
        <div
          className="h-4 w-64 mb-8 rounded animate-pulse-soft"
          style={{ background: "var(--color-surface-2)" }}
        />
      </div>
    );
  }

  // Get initials for avatar
  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || "??";

  return (
    <div className="max-w-2xl">
      {/* Premium Profile Header Card */}
      <div
        className="card overflow-hidden mb-8 animate-fade-in-up"
        style={{ padding: 0 }}
      >
        {/* Cover Gradient */}
        <div
          className="h-32 w-full relative"
          style={{
            background:
              "linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-400) 100%)",
          }}
        >
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          />
        </div>

        {/* Profile Details */}
        <div className="px-6 pb-8 relative flex flex-col items-center text-center">
          {/* Overlapping Avatar */}
          <div
            className="rounded-full flex items-center justify-center font-bold text-3xl shadow-md relative z-10"
            style={{
              width: 96,
              height: 96,
              background: "var(--color-surface-0)",
              padding: 4,
              marginTop: -48,
            }}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center shadow-sm"
              style={{
                background: "var(--color-brand-50)",
                color: "var(--color-brand-600)",
                border: "1px solid var(--color-brand-100)",
              }}
            >
              {initials}
            </div>
          </div>

          <div className="mt-4">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {profile.full_name || "No Name Set"}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                {user.email}
              </p>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <span
                className={`badge ${role === "owner" ? "badge-info" : "badge-neutral"}`}
                style={{ padding: "0.1rem 0.5rem", fontSize: "0.7rem" }}
              >
                {role === "owner" ? "Owner" : "Staff"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Section
        title="Personal Information"
        description="Update your name as it appears to other members of your shop."
      >
        <ProfileForm />
      </Section>

      <Section
        title="Account Security"
        description="Change your email address or update your password."
      >
        <SecurityForm />
      </Section>
    </div>
  );
}
