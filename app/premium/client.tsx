"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getClientGateway } from "@/lib/payment/client-gateway"
import Image from "next/image"

interface PremiumClientProps {
  isLoggedIn: boolean
  isPremium: boolean
  userName: string
  premiumPrice: number
}

export function PremiumClient({ isLoggedIn, isPremium, userName, premiumPrice }: PremiumClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handlePurchase = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!isLoggedIn) {
        router.push("/login?redirect=/premium")
        return
      }

      // Use the client gateway to create a transaction
      const gateway = getClientGateway()
      const result = await gateway.createTransaction({
        amount: premiumPrice,
        description: "SecretMe Premium Lifetime",
      })

      if (!result.success) {
        setError(result.error || "Failed to create payment transaction")
        return
      }

      // Redirect to payment page
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      } else {
        setError("No redirect URL provided")
      }
    } catch (error: any) {
      console.error("Error purchasing premium:", error)
      setError(error.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade to Premium</h1>
        <p className="mt-2 text-muted-foreground">
          Unlock all premium features and support the development of SecretMe
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Basic features for personal use</CardDescription>
            <div className="mt-4 text-3xl font-bold">Rp 0</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Unlimited messages</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Basic profile customization</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Standard support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Premium</CardTitle>
            <CardDescription>Enhanced features for power users</CardDescription>
            <div className="mt-4 text-3xl font-bold">Rp {premiumPrice.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">One-time payment, lifetime access</div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>All Free features</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Advanced profile customization</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>No ads</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Premium badge</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                <span>Early access to new features</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {isPremium ? (
              <Button className="w-full" disabled>
                You are Premium
              </Button>
            ) : (
              <Button className="w-full" onClick={handlePurchase} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Upgrade Now"
                )}
              </Button>
            )}

            {error && <div className="text-sm text-red-500">{error}</div>}

            <div className="mt-4 grid grid-cols-5 gap-2">
              <Image
                src="/payment-icons/bca.png"
                alt="BCA"
                width={40}
                height={20}
                className="h-6 w-auto object-contain"
              />
              <Image
                src="/payment-icons/mandiri.png"
                alt="Mandiri"
                width={40}
                height={20}
                className="h-6 w-auto object-contain"
              />
              <Image
                src="/payment-icons/bni.png"
                alt="BNI"
                width={40}
                height={20}
                className="h-6 w-auto object-contain"
              />
              <Image
                src="/payment-icons/qris.png"
                alt="QRIS"
                width={40}
                height={20}
                className="h-6 w-auto object-contain"
              />
              <Image
                src="/payment-icons/dana.png"
                alt="DANA"
                width={40}
                height={20}
                className="h-6 w-auto object-contain"
              />
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8">
        <div className="rounded-lg bg-muted p-4">
          <h3 className="text-lg font-medium">Secure Payment</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All payments are processed securely through our payment partners. Your payment information is never stored
            on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}
