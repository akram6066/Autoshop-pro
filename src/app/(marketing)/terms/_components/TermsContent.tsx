import Link from "next/link";
import { PolicySection, P, Ul } from "../../_components/PolicySection";
import { PolicyFooter } from "../../_components/PolicyFooter";

export function TermsContent({ effectiveDate }: { effectiveDate: string }) {
  return (
    <>
      <PolicySection title="1. Acceptance of Terms">
        <P>
          By accessing or using AutoShop Pro (&ldquo;the Service&rdquo;), you
          agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If
          you are using the Service on behalf of a business, you represent that
          you have the authority to bind that business to these Terms.
        </P>
        <P>If you do not agree to these Terms, you may not use the Service.</P>
      </PolicySection>

      <PolicySection title="2. Description of Service">
        <P>
          AutoShop Pro is a cloud-based, offline-first inventory management and
          point-of-sale platform designed for automotive parts shops (tires,
          batteries, rims, and related products). The Service includes:
        </P>
        <Ul>
          <li>Inventory tracking and stock management</li>
          <li>Point-of-sale (POS) with offline support</li>
          <li>Customer and debt management</li>
          <li>Sales reporting and analytics</li>
          <li>Multi-staff and multi-shop management</li>
        </Ul>
        <P>
          We reserve the right to modify, suspend, or discontinue any part of
          the Service at any time, with reasonable notice where practicable.
        </P>
      </PolicySection>

      <PolicySection title="3. Accounts">
        <P>
          You must create an account to use AutoShop Pro. You are responsible
          for:
        </P>
        <Ul>
          <li>
            Providing accurate, current, and complete registration information.
          </li>
          <li>
            Keeping your password confidential and not sharing it with anyone.
          </li>
          <li>
            All activity that occurs under your account, whether authorised by
            you or not.
          </li>
          <li>
            Promptly notifying us if you suspect unauthorised access to your
            account.
          </li>
        </Ul>
        <P>
          Staff accounts are created by shop owners. Owners are responsible for
          the actions of their staff members within the Service.
        </P>
      </PolicySection>

      <PolicySection title="4. Free Plan and Paid Plans">
        <P>
          AutoShop Pro offers a <strong>free plan</strong> that includes one
          shop, unlimited sales, full inventory tracking, and basic reports —
          with no credit card required. Free plan features may change with
          reasonable notice.
        </P>
        <P>
          Paid plans (when available) will be subject to the pricing and billing
          terms presented at the time of subscription. All fees are
          non-refundable except where required by applicable law.
        </P>
      </PolicySection>

      <PolicySection title="5. Acceptable Use">
        <P>You agree not to:</P>
        <Ul>
          <li>
            Use the Service for any unlawful purpose or in violation of any
            regulations, including Kenyan and applicable East African law.
          </li>
          <li>
            Reverse engineer, decompile, or attempt to extract the source code
            of the Service.
          </li>
          <li>
            Scrape, crawl, or use automated means to access or extract data from
            the Service without our prior written consent.
          </li>
          <li>
            Attempt to gain unauthorised access to other users&apos; accounts or
            data.
          </li>
          <li>Upload or distribute malware, viruses, or any malicious code.</li>
          <li>
            Use the Service to process transactions that are fraudulent,
            illegal, or that violate the rights of any third party.
          </li>
        </Ul>
        <P>
          Violation of this section may result in immediate suspension or
          termination of your account.
        </P>
      </PolicySection>

      <PolicySection title="6. Your Data">
        <P>
          You own all business data you enter into AutoShop Pro — your
          inventory, sales records, and customer information. We do not sell
          your data or use it for any purpose other than providing the Service.
        </P>
        <P>
          By using the Service, you grant us a limited, non-exclusive licence to
          store, process, and transmit your data solely to operate and improve
          the Service.
        </P>
        <P>
          You are responsible for ensuring you have the legal right to enter any
          customer data (names, phone numbers) into the Service, and that doing
          so complies with applicable data protection laws.
        </P>
      </PolicySection>

      <PolicySection title="7. Availability and Offline Mode">
        <P>
          We aim for high availability but do not guarantee uninterrupted access
          to the cloud-based features. AutoShop Pro is designed to continue
          working offline — sales and inventory changes made offline will sync
          when connectivity is restored.
        </P>
        <P>
          We are not liable for any data loss resulting from failed syncs due to
          prolonged offline use, browser data clearing, or device failure before
          data has synced.
        </P>
      </PolicySection>

      <PolicySection title="8. Intellectual Property">
        <P>
          The AutoShop Pro name, logo, design, and all software are the
          exclusive property of AutoShop Pro and its licensors. Nothing in these
          Terms transfers any intellectual property rights to you.
        </P>
        <P>
          You may not use our name, logo, or trademarks without our prior
          written consent.
        </P>
      </PolicySection>

      <PolicySection title="9. Disclaimer of Warranties">
        <P>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; without warranties of any kind, express or implied,
          including but not limited to warranties of merchantability, fitness
          for a particular purpose, or non-infringement. We do not warrant that
          the Service will be error-free, secure, or continuously available.
        </P>
      </PolicySection>

      <PolicySection title="10. Limitation of Liability">
        <P>
          To the fullest extent permitted by law, AutoShop Pro shall not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages, including but not limited to loss of profits, data,
          or business opportunities, arising out of or related to your use of
          the Service, even if we have been advised of the possibility of such
          damages.
        </P>
        <P>
          Our total liability for any claim arising from or related to the
          Service shall not exceed the amount you paid us in the three months
          preceding the claim, or KES 5,000, whichever is greater.
        </P>
      </PolicySection>

      <PolicySection title="11. Termination">
        <P>
          You may stop using the Service and delete your account at any time. We
          may suspend or terminate your account if you breach these Terms, with
          or without notice depending on the severity of the breach.
        </P>
        <P>
          On termination, your right to use the Service ceases immediately. We
          will retain your data for 30 days after termination to allow you to
          request an export, after which it will be deleted.
        </P>
      </PolicySection>

      <PolicySection title="12. Governing Law and Disputes">
        <P>
          These Terms are governed by the laws of the Republic of Kenya. Any
          dispute arising from these Terms or the Service shall first be
          attempted to be resolved amicably. If unresolved within 30 days,
          disputes shall be subject to the exclusive jurisdiction of the courts
          of Nairobi, Kenya.
        </P>
      </PolicySection>

      <PolicySection title="13. Changes to Terms">
        <P>
          We may update these Terms from time to time. We will give at least 14
          days&apos; notice of material changes by posting the updated Terms on
          this page and, where appropriate, notifying you by email. Your
          continued use of the Service after the effective date of the updated
          Terms constitutes acceptance.
        </P>
      </PolicySection>

      <PolicySection title="14. Contact">
        <P>Questions about these Terms?</P>
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
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/contact", label: "Contact Us" },
        ]}
      />
    </>
  );
}
