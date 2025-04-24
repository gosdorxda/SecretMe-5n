import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us - SecretMe",
  description: "Learn about SecretMe, the anonymous messaging platform",
}

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="space-y-8">
        <div className="border-b pb-8">
          <h1 className="text-3xl font-bold">About SecretMe</h1>
          <p className="text-gray-500 mt-2">
            SecretMe is an anonymous messaging platform created to facilitate honest and open communication.
          </p>
        </div>

        <div className="pt-4 space-y-6">
          <p className="text-gray-600">
            Our goal is to provide a safe space for sharing thoughts and feedback without fear of judgment.
          </p>

          <p className="text-gray-600">
            We believe in the power of anonymous communication to foster honesty and authenticity in our digital
            interactions. By removing the barriers of identity, people can express themselves more freely and genuinely.
          </p>

          <p className="text-gray-600">
            SecretMe was founded in 2023 with a mission to create a platform that balances anonymity with
            responsibility. While we enable anonymous messaging, we also implement measures to prevent misuse and ensure
            a positive experience for all users.
          </p>
        </div>
      </div>
    </div>
  )
}
