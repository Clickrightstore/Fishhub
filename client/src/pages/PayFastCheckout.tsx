import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PayFastCheckout() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get query params from URL
  const queryParams = new URLSearchParams(window.location.search);
  const bookIdsStr = queryParams.get("bookIds");
  const totalAmount = parseFloat(queryParams.get("amount") || "0");
  const bookIds = bookIdsStr ? bookIdsStr.split(",").map(Number) : [];

  const enabled = bookIds.length > 0 && totalAmount > 0;

  // Fetch PayFast form data from server
  const {
    data: formDataResponse,
    isLoading,
    error,
  } = trpc.payments.getPayFastForm.useQuery(
    { bookIds, amount: totalAmount },
    { enabled, retry: false }
  ) as any;

  const handlePayment = () => {
    if (!formDataResponse) return;
    setIsSubmitting(true);

    // Build a hidden form and POST it to PayFast
    const form = document.createElement("form");
    form.method = "POST";
    form.action = String(formDataResponse.action);

    Object.entries(formDataResponse.fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  // Guard: no book IDs or amount in URL
  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Invalid Checkout Link</h2>
            <p className="text-gray-600">
              No books or amount were specified. Please go back to the library and try again.
            </p>
            <Button onClick={() => navigate("/library")} className="w-full">
              Back to Library
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Preparing your payment...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state — shows the actual error message to help diagnose
  if (error || !formDataResponse) {
    const errorMessage =
      error?.message ||
      "Failed to prepare payment. This usually means the payment credentials are not configured yet.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Setup Error</h2>
            <p className="text-gray-600">{errorMessage}</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left w-full">
              <p className="text-sm font-semibold text-amber-800 mb-1">To fix this:</p>
              <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                <li>Go to your Manus project settings</li>
                <li>Add environment variables:<br />
                  <code className="text-xs bg-amber-100 px-1 rounded">PAYFAST_MERCHANT_ID</code><br />
                  <code className="text-xs bg-amber-100 px-1 rounded">PAYFAST_MERCHANT_KEY</code><br />
                  <code className="text-xs bg-amber-100 px-1 rounded">PAYFAST_PASSPHRASE</code>
                </li>
                <li>Redeploy the project</li>
              </ol>
            </div>
            <Button onClick={() => navigate(-1 as any)} className="w-full">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Ready to pay
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ready to Pay</h1>
            <p className="text-gray-600">
              Amount:{" "}
              <span className="font-semibold text-lg">
                R{totalAmount.toFixed(2)}
              </span>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              You will be redirected to PayFast to complete your payment securely.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate(-1 as any)}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Pay with PayFast"
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Secure payment powered by PayFast
          </p>
        </div>
      </Card>
    </div>
  );
}
