"use client";
import { Section } from "../_components/Section";
import { TeamSection } from "../_components/TeamSection";
import { useSubscription } from "@/hooks/useSubscription";

export default function TeamPage() {
  const { sub } = useSubscription();

  return (
    <Section title="Team">
      <TeamSection maxStaff={sub?.plan.maxStaffPerShop ?? 2} />
    </Section>
  );
}
