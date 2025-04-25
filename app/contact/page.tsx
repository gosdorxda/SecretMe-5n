import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, Building, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact Us - SecretMe",
  description: "Get in touch with the SecretMe team for support, feedback, or business inquiries",
}

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-8">
        <div className="border-b pb-8">
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="text-gray-500 mt-2">Get in touch with our team for support, feedback, or business inquiries</p>
        </div>

        <div className="pt-4 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-blue-500" />
                Email Us
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">General Inquiries:</p>
                  <p className="text-sm">hello@secretme.site</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Support:</p>
                  <p className="text-sm">hello@secretme.site</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Business Development:</p>
                  <p className="text-sm">hello@secretme.site</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-green-500" />
                Company
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Address:</p>
                  <p className="text-sm">Jl. Jelapan Sidorejo RT003/RW004</p>
                  <p className="text-sm">Bandongan, Magelang, Indonesia 56151</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Business Registration Number:</p>
                  <p className="text-sm">0220002789696 </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Need urgent assistance?</p>
                <p className="text-sm text-blue-700 mt-1">
                  For urgent matters, please email us at <span className="font-medium">hello@secretme.site</span> with
                  "URGENT" in the subject line.
                </p>
              </div>
            </div>
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
