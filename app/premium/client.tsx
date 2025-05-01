"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createTransaction, cancelTransaction } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { LoadingInline } from "@/components/loading-inline"

// Define payment method types
type PaymentMethod = {
  id: string
  name: string
  icon: string
  gateway: string
}

// Group payment methods by category
type PaymentCategory = {
  id: string
  name: string
  methods: PaymentMethod[]
}

export function PremiumClient({
  isLoggedIn,
  isPremium,
  userName,
  premiumPrice,
  urlStatus,
  urlOrderId,
  transaction,
  activeGateway = "duitku", // Default to duitku if not specified
}: {
  isLoggedIn: boolean
  isPremium: boolean
  userName: string
  premiumPrice: number
  urlStatus?: string
  urlOrderId?: string
  transaction: any
  activeGateway?: string
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<string>("QR")
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false)
  const [isCancellingTransaction, setIsCancellingTransaction] = useState(false)
  const [selectedGateway, setSelectedGateway] = useState<string>(activeGateway)

  // Format price with IDR
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(premiumPrice)

  // Define payment methods
  const paymentCategories: PaymentCategory[] = [
    {
      id: "va",
      name: "Virtual Account",
      methods: [
        { id: "BR", name: "BRI Virtual Account", icon: "/payment-icons/bri.png", gateway: "duitku" },
        { id: "M2", name: "Mandiri Virtual Account", icon: "/payment-icons/mandiri.png", gateway: "duitku" },
        { id: "I1", name: "BNI Virtual Account", icon: "/payment-icons/bni.png", gateway: "duitku" },
        { id: "BV", name: "BSI Virtual Account", icon: "/payment-icons/bsi.png", gateway: "tripay" },
        { id: "BT", name: "Permata Virtual Account", icon: "/payment-icons/permata.png", gateway: "duitku" },
        { id: "NC", name: "CIMB Niaga Virtual Account", icon: "/payment-icons/cimb.png", gateway: "tripay" },
      ],
    },
    {
      id: "ewallet",
      name: "E-Wallet",
      methods: [
        { id: "OV", name: "OVO", icon: "/payment-icons/ovo.png", gateway: "duitku" },
        { id: "DA", name: "DANA", icon: "/payment-icons/dana.png", gateway: "duitku" },
        { id: "SA", name: "ShopeePay", icon: "/payment-icons/shopeepay.png", gateway: "duitku" },
        { id: "LF", name: "LinkAja", icon: "/payment-icons/linkaja.png", gateway: "duitku" },
        { id: "QR", name: "QRIS", icon: "/payment-icons/qris.png", gateway: "duitku" },
      ],
    },
    {
      id: "retail",
      name: "Convenience Store",
      methods: [
        { id: "A1", name: "Alfamart", icon: "/payment-icons/alfamart.png", gateway: "duitku" },
        { id: "IR", name: "Indomaret", icon: "/payment-icons/indomaret.png", gateway: "tripay" },
      ],
    },
  ]

  // Filter payment methods based on selected gateway
  const filteredCategories = paymentCategories
    .map((category) => ({
      ...category,
      methods: category.methods.filter((method) => method.gateway === selectedGateway),
    }))
    .filter((category) => category.methods.length > 0)

  // Handle payment method selection
  const handleMethodSelect = (methodId: string, gateway: string) => {
    setSelectedMethod(methodId)
    setSelectedGateway(gateway)
  }

  // Handle transaction creation
  const handleCreateTransaction = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please login to continue with the payment",
        variant: "destructive",
      })
      router.push("/login?redirect=/premium")
      return
    }

    setIsCreatingTransaction(true)
    try {
      const result = await createTransaction({
        paymentMethod: selectedMethod,
        gatewayName: selectedGateway,
      })

      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl
      } else {
        toast({
          title: "Payment Error",
          description: result.error || "Failed to create payment. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTransaction(false)
    }
  }

  // Handle transaction cancellation
  const handleCancelTransaction = async () => {
    if (!transaction) return

    setIsCancellingTransaction(true)
    try {
      const result = await cancelTransaction({
        transactionId: transaction.id,
        gatewayReference: transaction.gateway_reference,
        gatewayName: transaction.payment_gateway,
      })

      if (result.success) {
        toast({
          title: "Transaction Cancelled",
          description: "Your transaction has been cancelled successfully.",
        })
        router.refresh()
      } else {
        toast({
          title: "Cancellation Error",
          description: result.error || "Failed to cancel transaction. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Cancellation error:", error)
      toast({
        title: "Cancellation Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsCancellingTransaction(false)
    }
  }

  // Check for URL status parameters on component mount
  useEffect(() => {
    if (urlStatus === "success" && urlOrderId) {
      toast({
        title: "Payment Successful",
        description: "Your payment is being processed. Thank you for your purchase!",
      })
      // Remove URL parameters
      window.history.replaceState({}, document.title, "/premium")
    } else if (urlStatus === "failed" || urlStatus === "cancel") {
      toast({
        title: "Payment Failed",
        description: "Your payment was not successful. Please try again.",
        variant: "destructive",
      })
      // Remove URL parameters
      window.history.replaceState({}, document.title, "/premium")
    }
  }, [urlStatus, urlOrderId, toast])

  // If user is already premium
  if (isPremium) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Premium Status</CardTitle>
            <CardDescription>You are already a premium member!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="mb-4 text-6xl">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Thank You, {userName}!</h3>
                <p className="text-muted-foreground">
                  You have full access to all premium features. Enjoy your premium experience!
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // If there's a pending transaction
  if (transaction && transaction.status === "pending") {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Transaction</CardTitle>
            <CardDescription>You have a pending payment transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6">
              <div className="text-center mb-6">
                <div className="mb-4 text-6xl">⏳</div>
                <h3 className="text-2xl font-bold mb-2">Payment in Progress</h3>
                <p className="text-muted-foreground mb-4">
                  Your payment for premium membership is being processed. Please complete the payment using the
                  instructions provided.
                </p>
                <div className="bg-muted p-4 rounded-md mb-4">
                  <p className="font-medium">Transaction Details:</p>
                  <p>Amount: {formattedPrice}</p>
                  <p>Payment Method: {transaction.payment_method || "Selected payment method"}</p>
                  <p>Transaction ID: {transaction.plan_id}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleCancelTransaction} disabled={isCancellingTransaction}>
                  {isCancellingTransaction ? <LoadingInline /> : "Cancel Transaction"}
                </Button>
                {transaction.payment_url && (
                  <Button onClick={() => (window.location.href = transaction.payment_url)}>Continue Payment</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default view - payment selection
  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Upgrade to Premium</CardTitle>
          <CardDescription>Unlock all premium features with a one-time payment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-bold text-lg mb-2">Premium Benefits</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Unlimited message storage</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Advanced analytics and insights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Priority customer support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Custom profile themes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>No advertisements</span>
                  </li>
                </ul>
              </div>
              <div className="bg-primary/10 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Lifetime Access</h3>
                  <div className="text-xl font-bold">{formattedPrice}</div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">One-time payment, no recurring fees</p>
              </div>
            </div>

            <div>
              <Tabs defaultValue={selectedGateway} onValueChange={setSelectedGateway}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="duitku">Duitku</TabsTrigger>
                  <TabsTrigger value="tripay">TriPay</TabsTrigger>
                </TabsList>
                <TabsContent value={selectedGateway} className="mt-0">
                  <div className="space-y-4">
                    {filteredCategories.map((category) => (
                      <div key={category.id}>
                        <h3 className="font-medium mb-2">{category.name}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {category.methods.map((method) => (
                            <div
                              key={method.id}
                              className={`border rounded-md p-2 cursor-pointer transition-colors ${
                                selectedMethod === method.id && selectedGateway === method.gateway
                                  ? "border-primary bg-primary/10"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => handleMethodSelect(method.id, method.gateway)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 relative flex-shrink-0">
                                  <Image
                                    src={method.icon || "/placeholder.svg"}
                                    alt={method.name}
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <span className="text-sm">{method.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleCreateTransaction}
            disabled={isCreatingTransaction || !selectedMethod}
            className="w-full md:w-auto"
          >
            {isCreatingTransaction ? <LoadingInline /> : <>Proceed to Payment</>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
