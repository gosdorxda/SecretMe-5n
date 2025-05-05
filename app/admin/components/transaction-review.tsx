"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TransactionReview() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadTransactions()
  }, [])

  async function loadTransactions() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("premium_transactions")
        .select("*, users(name, email)")
        .eq("status", "review")
        .order("updated_at", { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function approveTransaction(id: string) {
    try {
      setProcessing(id)

      // Update transaction status
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "success",
          updated_at: new Date().toISOString(),
          payment_details: {
            ...transactions.find((t) => t.id === id)?.payment_details,
            approved_by: "admin",
            approved_at: new Date().toISOString(),
          },
        })
        .eq("id", id)

      if (updateError) throw updateError

      // Get user ID from transaction
      const transaction = transactions.find((t) => t.id === id)
      if (!transaction) throw new Error("Transaction not found")

      // Update user premium status
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
          premium_until: calculatePremiumUntil(),
        })
        .eq("id", transaction.user_id)

      if (userUpdateError) throw userUpdateError

      toast({
        title: "Transaction approved",
        description: "User has been upgraded to premium status",
        variant: "success",
      })

      // Refresh transactions list
      loadTransactions()
    } catch (err: any) {
      toast({
        title: "Error approving transaction",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  async function rejectTransaction(id: string) {
    try {
      setProcessing(id)

      // Update transaction status
      const { error: updateError } = await supabase
        .from("premium_transactions")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
          payment_details: {
            ...transactions.find((t) => t.id === id)?.payment_details,
            rejected_by: "admin",
            rejected_at: new Date().toISOString(),
          },
        })
        .eq("id", id)

      if (updateError) throw updateError

      toast({
        title: "Transaction rejected",
        description: "The transaction has been marked as rejected",
        variant: "success",
      })

      // Refresh transactions list
      loadTransactions()
    } catch (err: any) {
      toast({
        title: "Error rejecting transaction",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  function calculatePremiumUntil() {
    // Default to 30 days from now
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString()
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString()
  }

  function getFraudRiskBadge(risk: string | undefined) {
    if (!risk) return null

    switch (risk) {
      case "high":
        return (
          <Badge variant="destructive" className="ml-2">
            <AlertCircle className="w-3 h-3 mr-1" /> High Risk
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="warning" className="ml-2">
            <AlertTriangle className="w-3 h-3 mr-1" /> Medium Risk
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="ml-2">
            Low Risk
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return <div className="p-4">Loading transactions for review...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Review</CardTitle>
          <CardDescription>No transactions requiring review at this time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            All transactions have been processed or no suspicious transactions detected.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Transactions Requiring Review</h2>
      <p className="text-muted-foreground">
        These transactions have been flagged for manual review due to potential fraud or other issues.
      </p>

      {transactions.map((transaction) => (
        <Card
          key={transaction.id}
          className={transaction.payment_details?.fraud_risk === "high" ? "border-red-500" : ""}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Transaction {transaction.reference_id}
                  {getFraudRiskBadge(transaction.payment_details?.fraud_risk)}
                </CardTitle>
                <CardDescription>
                  {transaction.users?.name} ({transaction.users?.email})
                </CardDescription>
              </div>
              <Badge>{transaction.payment_method}</Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Amount</p>
                <p>
                  {transaction.amount} {transaction.currency}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Date</p>
                <p>{formatDate(transaction.created_at)}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <p className="text-sm font-medium">Review Reason:</p>
              <p className="text-sm text-muted-foreground">
                {transaction.payment_details?.review_reason || "Manual review required"}
              </p>
            </div>

            {transaction.payment_details?.fraud_indicators && (
              <div className="mt-4 p-3 bg-red-50 rounded-md">
                <p className="text-sm font-medium text-red-800">Fraud Indicators:</p>
                <ul className="list-disc pl-5 text-sm text-red-700">
                  {transaction.payment_details.fraud_indicators.map((indicator: string, i: number) => (
                    <li key={i}>{indicator}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => rejectTransaction(transaction.id)}
              disabled={processing === transaction.id}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button onClick={() => approveTransaction(transaction.id)} disabled={processing === transaction.id}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
