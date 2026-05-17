import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ChevronLeft, Copy, CheckCircle, AlertCircle, Loader2, CreditCard, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ManualPayment() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: paymentConfig } = trpc.payments.getPaymentConfig.useQuery();
  const { data: paymentRequests = [] } = trpc.payments.getMyPaymentRequests.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Sign in to make payment</h2>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const latestPayment = paymentRequests[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Orders
          </button>
          <h1 className="text-4xl font-bold text-slate-900">Complete Payment</h1>
          <p className="text-slate-600 mt-2">Transfer funds to confirm your book purchase</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl mx-auto px-4 py-12">
        {!latestPayment ? (
          <Card className="p-16 text-center border-2 border-dashed">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Pending Payments</h3>
            <p className="text-slate-600 mb-8 text-lg">
              You don't have any pending payment requests. Browse our library to get started.
            </p>
            <Button onClick={() => navigate("/library")} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              Browse Books
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Payment Instructions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Amount Card */}
              <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Amount Due</h2>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  R{Number(latestPayment.amount).toFixed(2)}
                </div>
                <p className="text-slate-600">Order #{latestPayment.orderId}</p>
              </Card>

              {/* Bank Details Card */}
              {paymentConfig ? (
                <Card className="p-8 border-2">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold text-slate-900">Bank Transfer Details</h3>
                  </div>

                  <div className="space-y-5">
                    {/* Bank Name */}
                    <div className="bg-slate-50 p-5 rounded-lg">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Bank Name</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg text-slate-900 font-semibold">{paymentConfig.bankName}</p>
                        <button
                          onClick={() => handleCopy(paymentConfig.bankName, "Bank name")}
                          className="p-2 hover:bg-slate-200 rounded transition"
                        >
                          {copiedField === "Bank name" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Account Holder */}
                    <div className="bg-slate-50 p-5 rounded-lg">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Account Holder</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg text-slate-900 font-semibold">{paymentConfig.accountHolder}</p>
                        <button
                          onClick={() => handleCopy(paymentConfig.accountHolder, "Account holder")}
                          className="p-2 hover:bg-slate-200 rounded transition"
                        >
                          {copiedField === "Account holder" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Account Number */}
                    <div className="bg-slate-50 p-5 rounded-lg">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Account Number</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg text-slate-900 font-mono font-bold">{paymentConfig.accountNumber}</p>
                        <button
                          onClick={() => handleCopy(paymentConfig.accountNumber, "Account number")}
                          className="p-2 hover:bg-slate-200 rounded transition"
                        >
                          {copiedField === "Account number" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Branch Code */}
                    {paymentConfig.branchCode && (
                      <div className="bg-slate-50 p-5 rounded-lg">
                        <p className="text-sm font-semibold text-slate-600 mb-2">Branch Code</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg text-slate-900 font-mono font-bold">{paymentConfig.branchCode}</p>
                          <button
                            onClick={() => handleCopy(paymentConfig.branchCode || "", "Branch code")}
                            className="p-2 hover:bg-slate-200 rounded transition"
                          >
                            {copiedField === "Branch code" ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Reference */}
                    <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                      <p className="text-sm font-semibold text-slate-600 mb-2">Payment Reference (Important)</p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg text-blue-900 font-mono font-bold">{paymentConfig.reference}</p>
                        <button
                          onClick={() => handleCopy(paymentConfig.reference, "Reference")}
                          className="p-2 hover:bg-blue-100 rounded transition"
                        >
                          {copiedField === "Reference" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {paymentConfig.instructions && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-900"><strong>Instructions:</strong> {paymentConfig.instructions}</p>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <Loader2 className="w-8 h-8 text-slate-400 mx-auto mb-4 animate-spin" />
                  <p className="text-slate-600">Loading bank details...</p>
                </Card>
              )}

              {/* Steps Card */}
              <Card className="p-8 bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900 mb-6">How to Pay</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <p className="font-semibold text-slate-900">Open Your Bank App</p>
                      <p className="text-slate-600 text-sm">Use your mobile banking app or online banking</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <p className="font-semibold text-slate-900">Enter Transfer Details</p>
                      <p className="text-slate-600 text-sm">Copy the bank details above (click the copy icons)</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <p className="font-semibold text-slate-900">Add Payment Reference</p>
                      <p className="text-slate-600 text-sm">Use the reference code in the description/memo field</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                    <div>
                      <p className="font-semibold text-slate-900">Confirm & Send</p>
                      <p className="text-slate-600 text-sm">Review details and complete the transfer</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Payment Status */}
              <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-amber-600" />
                  <h3 className="font-bold text-slate-900">Status</h3>
                </div>
                <p className="text-sm text-amber-900 font-semibold">Awaiting Payment</p>
                <p className="text-xs text-amber-700 mt-2">Payment will be verified within 24 hours</p>
              </Card>

              {/* Order Summary */}
              <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Order ID</span>
                    <span className="font-semibold text-slate-900">#{latestPayment.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Amount</span>
                    <span className="font-semibold text-slate-900">R{Number(latestPayment.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Status</span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">Pending</span>
                  </div>
                </div>
              </Card>

              {/* Help Card */}
              <Card className="p-6 bg-blue-50 border-2 border-blue-200">
                <h3 className="font-bold text-slate-900 mb-3">Need Help?</h3>
                <p className="text-sm text-slate-600 mb-4">
                  If you have any questions about the payment process, please contact our support team.
                </p>
                <Button variant="outline" className="w-full text-blue-600 border-blue-600 hover:bg-blue-100">
                  Contact Support
                </Button>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate("/orders")} 
                  className="w-full bg-slate-600 hover:bg-slate-700"
                >
                  Back to Orders
                </Button>
                <Button 
                  onClick={() => navigate("/library")} 
                  variant="outline"
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
