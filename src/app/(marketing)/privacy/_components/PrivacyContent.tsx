import Link from "next/link";
import { PolicySection, P, Ul } from "../../_components/PolicySection";
import { PolicyFooter } from "../../_components/PolicyFooter";

export function PrivacyContent({ effectiveDate }: { effectiveDate: string }) {
  return (
    <>
      <PolicySection title="1. Introduction">
        <P>
          AutoShop Pro (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or
          &ldquo;us&rdquo;) operates the AutoShop Pro platform — an
          offline-first inventory management and point-of-sale system for
          automotive parts shops across East Africa. This Privacy Policy
          explains what data we collect, how we use it, and your rights
          regarding that data.
        </P>
        <P>
          By using AutoShop Pro you agree to the collection and use of
          information as described in this policy. If you do not agree, please
          stop using the service.
        </P>
      </PolicySection>

      <PolicySection title="2. Data We Collect">
        <P>
          <strong>Account data:</strong> When you sign up we collect your full
          name and email address. Shop owners also provide a shop name and
          optional address.
        </P>
        <P>
          <strong>Business data:</strong> Data you enter into AutoShop Pro —
          inventory items, sales records, customer names and phone numbers,
          purchase orders, staff members — is stored on our servers so it can
          sync across your devices.
        </P>
        <P>
          <strong>Technical data:</strong> We automatically collect error logs
          (via Sentry), a stable per-device identifier stored in your
          browser&apos;s local storage, and standard server logs (IP address,
          browser type, pages visited). We do not use advertising cookies or
          tracking pixels.
        </P>
        <P>
          <strong>Support communications:</strong> When you contact us via
          WhatsApp, email, or the contact form we retain the conversation to
          help resolve your issue.
        </P>
      </PolicySection>

      <PolicySection title="3. How We Use Your Data">
        <Ul>
          <li>To operate and deliver the AutoShop Pro service.</li>
          <li>
            To sync your data across devices and restore it when you log in.
          </li>
          <li>
            To diagnose and fix technical errors (Sentry error monitoring).
          </li>
          <li>To respond to support requests.</li>
          <li>
            To send important account and service notices (not marketing without
            consent).
          </li>
          <li>To detect and prevent fraud or abuse.</li>
        </Ul>
        <P>
          We do <strong>not</strong> sell your data. We do not use your business
          data (inventory, sales, customers) for any purpose other than
          providing the service to you.
        </P>
      </PolicySection>

      <PolicySection title="4. Data Storage and Third Parties">
        <P>
          Your data is stored in <strong>Supabase</strong> (PostgreSQL database
          hosted on AWS). Supabase is SOC 2 Type II certified. Error reports are
          sent to <strong>Sentry</strong> (US). No other third parties have
          access to your business data.
        </P>
        <P>
          Data may be processed in the United States or European Union where
          these providers operate. By using AutoShop Pro you consent to this
          transfer.
        </P>
      </PolicySection>

      <PolicySection title="5. Data Retention">
        <Ul>
          <li>
            <strong>Account and business data</strong> — retained for as long as
            your account is active. Deleted within 30 days of account closure on
            request.
          </li>
          <li>
            <strong>Audit logs</strong> — retained for 1 year then automatically
            deleted.
          </li>
          <li>
            <strong>Sync queue entries</strong> — synced entries deleted after
            90 days; failed entries after 90 days.
          </li>
          <li>
            <strong>Error logs (Sentry)</strong> — retained for 90 days per
            Sentry&apos;s defaults.
          </li>
        </Ul>
      </PolicySection>

      <PolicySection title="6. Your Rights">
        <P>You have the right to:</P>
        <Ul>
          <li>
            <strong>Access</strong> — request a copy of the personal data we
            hold about you.
          </li>
          <li>
            <strong>Correction</strong> — update incorrect data at any time from
            your Profile settings.
          </li>
          <li>
            <strong>Deletion</strong> — request deletion of your account and
            associated personal data.
          </li>
          <li>
            <strong>Portability</strong> — export your sales data as CSV from
            the Reports page.
          </li>
        </Ul>
        <P>
          To exercise any of these rights, contact us via WhatsApp at +254 799
          964 428 or the{" "}
          <Link
            href="/contact"
            style={{
              color: "var(--color-brand-600)",
              textDecoration: "underline",
            }}
          >
            contact page
          </Link>
          . We will respond within 7 business days.
        </P>
      </PolicySection>

      <PolicySection title="7. Security">
        <P>
          All data is transmitted over HTTPS (TLS 1.2+). Database access is
          governed by row-level security policies so each shop can only access
          its own data. Passwords are never stored — authentication is handled
          by Supabase Auth (bcrypt-hashed internally). We perform periodic
          security reviews.
        </P>
        <P>
          No system is perfectly secure. In the event of a breach that affects
          your data we will notify you within 72 hours as required by applicable
          law.
        </P>
      </PolicySection>

      <PolicySection title="8. Cookies">
        <P>
          AutoShop Pro uses a single session cookie set by Supabase Auth to keep
          you logged in. We do not use advertising cookies, analytics cookies,
          or third-party tracking cookies. You can clear this cookie by logging
          out.
        </P>
      </PolicySection>

      <PolicySection title="9. Children">
        <P>
          AutoShop Pro is a business tool intended for users aged 16 and older.
          We do not knowingly collect personal data from anyone under 16. If you
          believe a minor has created an account, contact us and we will delete
          it promptly.
        </P>
      </PolicySection>

      <PolicySection title="10. Changes to This Policy">
        <P>
          We may update this Privacy Policy from time to time. When we do, we
          will update the effective date at the top of this page and, for
          material changes, notify you by email. Continued use of AutoShop Pro
          after the changes take effect constitutes acceptance of the new
          policy.
        </P>
      </PolicySection>

      <PolicySection title="11. Contact">
        <P>Questions about this Privacy Policy? Reach us at:</P>
        <Ul>
          <li>
            WhatsApp:{" "}
            <a
              href="https://wa.me/254799964428"
              style={{ color: "var(--color-brand-600)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              +254 799 964 428
            </a>
          </li>
          <li>
            Contact form:{" "}
            <Link href="/contact" style={{ color: "var(--color-brand-600)" }}>
              autoshoppro.com/contact
            </Link>
          </li>
        </Ul>
      </PolicySection>

      <PolicyFooter
        lastUpdated={effectiveDate}
        links={[
          { href: "/terms", label: "Terms of Service" },
          { href: "/contact", label: "Contact Us" },
        ]}
      />
    </>
  );
}
