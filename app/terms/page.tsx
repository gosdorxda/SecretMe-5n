import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Terms of Service - SecretMe",
  description: "Terms and conditions for using the SecretMe anonymous messaging platform",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SecretMe (the "Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part of the terms, you may not access the Service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">2. Description of Service</h2>
            <p>
              SecretMe is an anonymous messaging platform that allows users to receive anonymous messages from others.
              The Service provides users with a unique link that can be shared with others to receive anonymous
              messages.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">3. User Accounts</h2>
            <p>
              To use certain features of the Service, you must register for an account. You agree to provide accurate,
              current, and complete information during the registration process and to update such information to keep
              it accurate, current, and complete.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any
              activities or actions under your password. We encourage you to use "strong" passwords (passwords that use
              a combination of upper and lower case letters, numbers, and symbols) with your account.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Send or post any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar,
                obscene, or otherwise objectionable.
              </li>
              <li>
                Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a
                person or entity.
              </li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
              <li>Violate any applicable laws or regulations.</li>
              <li>Collect or store personal data about other users without their consent.</li>
              <li>Use the Service for any illegal or unauthorized purpose.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">5. Content</h2>
            <p>
              Our Service allows you to post, link, store, share and otherwise make available certain information, text,
              graphics, or other material ("Content"). You are responsible for the Content that you post on or through
              the Service, including its legality, reliability, and appropriateness.
            </p>
            <p>
              By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours
              (you own it) or you have the right to use it and grant us the rights and license as provided in these
              Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights,
              publicity rights, copyrights, contract rights or any other rights of any person.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">6. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. If you wish to terminate your
              account, you may simply discontinue using the Service or delete your account.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">7. Limitation of Liability</h2>
            <p>
              In no event shall SecretMe, nor its directors, employees, partners, agents, suppliers, or affiliates, be
              liable for any indirect, incidental, special, consequential or punitive damages, including without
              limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your
              access to or use of or inability to access or use the Service; (ii) any conduct or content of any third
              party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or
              alteration of your transmissions or content, whether based on warranty, contract, tort (including
              negligence) or any other legal theory, whether or not we have been informed of the possibility of such
              damage.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">8. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision
              is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What
              constitutes a material change will be determined at our sole discretion.
            </p>
            <p>
              By continuing to access or use our Service after those revisions become effective, you agree to be bound
              by the revised terms. If you do not agree to the new terms, please stop using the Service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">9. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of Indonesia, without regard to
              its conflict of law provisions.
            </p>
            <p>
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those
              rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining
              provisions of these Terms will remain in effect.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">10. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <p className="font-medium">support@secretme.com</p>
          </div>

          <div className="pt-6 flex justify-center">
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
