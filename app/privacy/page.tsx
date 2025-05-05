import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Privacy Policy - SecretMe",
  description: "Privacy policy for the SecretMe anonymous messaging platform",
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b pb-8">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="space-y-8 pt-4">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">1. Introduction</h2>
            <p>
              Welcome to SecretMe's Privacy Policy. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our anonymous messaging service.
            </p>
            <p>
              We respect your privacy and are committed to protecting your personal data. Please read this Privacy
              Policy carefully to understand our practices regarding your personal data.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">2. Information We Collect</h2>
            <p>
              We collect several different types of information for various purposes to provide and improve our Service
              to you:
            </p>
            <h3 className="text-lg font-semibold mt-4">2.1 Personal Data</h3>
            <p>
              While using our Service, we may ask you to provide us with certain personally identifiable information
              that can be used to contact or identify you ("Personal Data"). Personally identifiable information may
              include, but is not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address</li>
              <li>First name and last name</li>
              <li>Cookies and Usage Data</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">2.2 Usage Data</h3>
            <p>
              We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data
              may include information such as your computer's Internet Protocol address (e.g., IP address), browser
              type, browser version, the pages of our Service that you visit, the time and date of your visit, the time
              spent on those pages, unique device identifiers, and other diagnostic data.
            </p>

            <h3 className="text-lg font-semibold mt-4">2.3 Anonymous Messages</h3>
            <p>
              The content of anonymous messages sent through our platform is stored on our servers. While the sender's
              identity is not linked to these messages, the content itself is stored to provide the service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">3. How We Use Your Information</h2>
            <p>We use the collected data for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">4. Data Security</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission over the
              Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable
              means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">5. Anonymous Messaging</h2>
            <p>
              Our platform is designed to allow users to receive anonymous messages. While we do not link the identity
              of message senders to the messages they send, we do store the content of these messages on our servers. We
              may use automated systems to monitor content for violations of our terms of service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">6. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to track the activity on our Service and hold certain
              information.
            </p>
            <p>
              Cookies are files with a small amount of data which may include an anonymous unique identifier. Cookies
              are sent to your browser from a website and stored on your device. Tracking technologies also used are
              beacons, tags, and scripts to collect and track information and to improve and analyze our Service.
            </p>
            <p>
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However,
              if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">7. Third-Party Services</h2>
            <p>
              Our Service may contain links to other sites that are not operated by us. If you click on a third-party
              link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy
              of every site you visit.
            </p>
            <p>
              We have no control over and assume no responsibility for the content, privacy policies, or practices of
              any third-party sites or services.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">8. Children's Privacy</h2>
            <p>
              Our Service does not address anyone under the age of 13. We do not knowingly collect personally
              identifiable information from anyone under the age of 13. If you are a parent or guardian and you are
              aware that your child has provided us with Personal Data, please contact us. If we become aware that we
              have collected Personal Data from children without verification of parental consent, we take steps to
              remove that information from our servers.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page.
            </p>
            <p>
              We will let you know via email and/or a prominent notice on our Service, prior to the change becoming
              effective and update the "effective date" at the top of this Privacy Policy.
            </p>
            <p>
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy
              are effective when they are posted on this page.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">10. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p className="font-medium">hello@secretme.site</p>
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
