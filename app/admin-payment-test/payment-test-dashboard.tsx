"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createTestTransaction, simulatePaymentNotification, checkTransactionStatus } from "./actions"
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

interface Transaction {
  id: string
  plan_id: string
  user_id: string
  amount: number
  status: string
  payment_method: string
  gateway_reference: string
  created_at: string
  updated_at: string
}

interface PaymentTestDashboardProps {
  userId: string
}

export function PaymentTestDashboard({ userId }: PaymentTestDashboardProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [amount, setAmount] = useState("49000")
  const [paymentMethod, setPaymentMethod] = useState("VC") // Credit Card
  const [resultCode, setResultCode] = useState("00") // Success
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null)
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const { toast } = useToast()

  // Fungsi untuk menambahkan log
  const addLog = (message: string) => {
    setLogs((prevLogs) => [`[${new Date().toISOString()}] ${message}`, ...prevLogs])
  }

  // Fungsi untuk membuat transaksi baru
  const handleCreateTransaction = async () => {
    try {
      setIsCreating(true)
      addLog("Creating new test transaction...")

      const result = await createTestTransaction(Number(amount))

      if (result.success) {
        setCurrentTransaction(result.transaction)
        addLog(`Transaction created successfully: ${result.transaction.plan_id}`)
        toast({
          title: "Transaction Created",
          description: `Order ID: ${result.transaction.plan_id}`,
        })
      } else {
        addLog(`Failed to create transaction: ${result.error}`)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating transaction:", error)
      addLog(`Error creating transaction: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Fungsi untuk mensimulasikan notifikasi pembayaran
  const handleSimulateNotification = async () => {
    if (!currentTransaction) {
      toast({
        title: "Error",
        description: "No active transaction to simulate",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSimulating(true)
      addLog(`Simulating payment notification with result code: ${resultCode}...`)

      const result = await simulatePaymentNotification({
        merchantOrderId: currentTransaction.plan_id,
        resultCode: resultCode,
        amount: currentTransaction.amount.toString(),
        paymentCode: paymentMethod,
      })

      if (result.success) {
        addLog(`Notification simulation successful: ${result.message}`)
        toast({
          title: "Notification Sent",
          description: result.message,
        })

        // Refresh transaction status after simulation
        await handleCheckStatus()
      } else {
        addLog(`Notification simulation failed: ${result.error}`)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error simulating notification:", error)
      addLog(`Error simulating notification: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to simulate notification",
        variant: "destructive",
      })
    } finally {
      setIsSimulating(false)
    }
  }

  // Fungsi untuk memeriksa status transaksi
  const handleCheckStatus = async () => {
    if (!currentTransaction) {
      toast({
        title: "Error",
        description: "No active transaction to check",
        variant: "destructive",
      })
      return
    }

    try {
      setIsChecking(true)
      addLog(`Checking transaction status for: ${currentTransaction.plan_id}...`)

      const result = await checkTransactionStatus(currentTransaction.plan_id)

      if (result.success) {
        setCurrentTransaction(result.transaction)
        addLog(`Transaction status: ${result.transaction.status}`)
        toast({
          title: "Status Updated",
          description: `Current status: ${result.transaction.status}`,
        })
      } else {
        addLog(`Failed to check status: ${result.error}`)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking status:", error)
      addLog(`Error checking status: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to check transaction status",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Fungsi untuk memuat riwayat transaksi
  const loadTransactionHistory = async () => {
    try {
      const response = await fetch("/api/admin/transactions")
      if (!response.ok) {
        throw new Error("Failed to load transaction history")
      }
      const data = await response.json()
      setTransactionHistory(data.transactions || [])
    } catch (error) {
      console.error("Error loading transaction history:", error)
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive",
      })
    }
  }

  // Memuat riwayat transaksi saat komponen dimuat
  useEffect(() => {
    loadTransactionHistory()
  }, [])

  // Fungsi untuk memilih transaksi dari riwayat
  const selectTransaction = (transaction: Transaction) => {
    setCurrentTransaction(transaction)
    addLog(`Selected transaction: ${transaction.plan_id}`)
  }

  // Fungsi untuk mendapatkan status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <div className="flex items-center text-green-500">
            <CheckCircle className="w-4 h-4 mr-1" />
            Success
          </div>
        )
      case "failed":
        return (
          <div className="flex items-center text-red-500">
            <XCircle className="w-4 h-4 mr-1" />
            Failed
          </div>
        )
      case "pending":
        return (
          <div className="flex items-center text-yellow-500">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </div>
        )
      default:
        return (
          <div className="flex items-center text-gray-500">
            <AlertCircle className="w-4 h-4 mr-1" />
            Unknown
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Payment Integration Test Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Use this dashboard to test the payment integration with Duitku. You can create test transactions, simulate
        payment notifications, and check transaction status.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="create">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="create">Create Transaction</TabsTrigger>
              <TabsTrigger value="simulate">Simulate Notification</TabsTrigger>
              <TabsTrigger value="check">Check Status</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>Create Test Transaction</CardTitle>
                  <CardDescription>Create a new test transaction for payment integration testing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (IDR)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCreateTransaction} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Transaction"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="simulate">
              <Card>
                <CardHeader>
                  <CardTitle>Simulate Payment Notification</CardTitle>
                  <CardDescription>
                    Simulate a payment notification from Duitku for the current transaction.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <select
                        id="paymentMethod"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="VC">Credit Card (VC)</option>
                        <option value="BC">BCA Transfer (BC)</option>
                        <option value="M2">Mandiri Transfer (M2)</option>
                        <option value="VA">BNI Transfer (VA)</option>
                        <option value="I1">BRI Transfer (I1)</option>
                        <option value="B1">CIMB Transfer (B1)</option>
                        <option value="QR">QRIS (QR)</option>
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="resultCode">Result Code</Label>
                      <select
                        id="resultCode"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={resultCode}
                        onChange={(e) => setResultCode(e.target.value)}
                      >
                        <option value="00">Success (00)</option>
                        <option value="01">Success with Warning (01)</option>
                        <option value="02">Pending (02)</option>
                        <option value="03">Failed (03)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSimulateNotification}
                    disabled={isSimulating || !currentTransaction}
                    className="w-full"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      "Simulate Notification"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="check">
              <Card>
                <CardHeader>
                  <CardTitle>Check Transaction Status</CardTitle>
                  <CardDescription>Check the current status of the transaction.</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentTransaction ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm font-medium">Order ID:</div>
                        <div className="text-sm font-mono">{currentTransaction.plan_id}</div>

                        <div className="text-sm font-medium">Amount:</div>
                        <div className="text-sm">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(currentTransaction.amount)}
                        </div>

                        <div className="text-sm font-medium">Status:</div>
                        <div className="text-sm">{getStatusBadge(currentTransaction.status)}</div>

                        <div className="text-sm font-medium">Payment Method:</div>
                        <div className="text-sm">{currentTransaction.payment_method || "Not set"}</div>

                        <div className="text-sm font-medium">Created At:</div>
                        <div className="text-sm">{new Date(currentTransaction.created_at).toLocaleString()}</div>

                        <div className="text-sm font-medium">Updated At:</div>
                        <div className="text-sm">{new Date(currentTransaction.updated_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No active transaction. Create a new transaction or select one from history.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCheckStatus} disabled={isChecking || !currentTransaction} className="w-full">
                    {isChecking ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Check Status"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Test Logs</CardTitle>
              <CardDescription>Recent actions and their results.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 h-[200px] overflow-y-auto font-mono text-xs">
                {logs.length > 0 ? (
                  logs.map((log, index) => <div key={index}>{log}</div>)
                ) : (
                  <div className="text-muted-foreground">No logs yet. Start testing to see logs here.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent test transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {transactionHistory.length > 0 ? (
                  transactionHistory.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="border rounded-md p-3 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => selectTransaction(transaction)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-mono text-xs truncate">{transaction.plan_id}</div>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <div className="text-sm mt-1">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(transaction.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No transaction history found.</div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={loadTransactionHistory} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh History
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
