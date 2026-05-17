import { useState, useEffect } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ChevronLeft, Check, X, Loader2, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminPayments() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    branchCode: "",
    reference: "",
    instructions: "",
  });

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-6">You don't have permission to access this page</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Fetch current payment config
  const { data: currentConfig, isLoading: isLoadingConfig } = trpc.payments.getPaymentConfig.useQuery();
  const setPaymentConfigMutation = trpc.payments.setPaymentConfig.useMutation();

  // Initialize form with current config when it loads
  React.useEffect(() => {
    if (currentConfig && !formData.bankName) {
      setFormData({
        bankName: currentConfig.bankName || "",
        accountHolder: currentConfig.accountHolder || "",
        accountNumber: currentConfig.accountNumber || "",
        branchCode: currentConfig.branchCode || "",
        reference: currentConfig.reference || "",
        instructions: currentConfig.instructions || "",
      });
    }
  }, [currentConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveConfig = async () => {
    // Validate required fields
    if (!formData.bankName.trim()) {
      toast.error("Bank name is required");
      return;
    }
    if (!formData.accountHolder.trim()) {
      toast.error("Account holder name is required");
      return;
    }
    if (!formData.accountNumber.trim()) {
      toast.error("Account number is required");
      return;
    }
    if (!formData.reference.trim()) {
      toast.error("Payment reference is required");
      return;
    }

    setIsSaving(true);
    try {
      await setPaymentConfigMutation.mutateAsync({
        bankName: formData.bankName,
        accountHolder: formData.accountHolder,
        accountNumber: formData.accountNumber,
        branchCode: formData.branchCode || undefined,
        reference: formData.reference,
        instructions: formData.instructions || undefined,
      });
      toast.success("Payment configuration saved successfully!");
    } catch (error) {
      console.error("Error saving payment config:", error);
      toast.error("Failed to save payment configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Admin
          </button>
          <h1 className="text-4xl font-bold text-slate-900">Payment Management</h1>
          <p className="text-slate-600 mt-2">Configure bank details for manual payments</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-2 border-blue-200 mb-8">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Bank Details Configuration</h3>
              <p className="text-blue-800 text-sm">
                These bank details will be displayed to customers when they make manual payment requests. Make sure all information is accurate and up-to-date.
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Configuration Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Bank Account Details</h2>

          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bank Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Bank Name *
                </label>
                <Input
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="e.g., First National Bank"
                  className="text-base"
                />
                <p className="text-xs text-slate-500 mt-1">The name of your bank</p>
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Account Holder Name *
                </label>
                <Input
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleInputChange}
                  placeholder="e.g., Fishing Community Hub"
                  className="text-base"
                />
                <p className="text-xs text-slate-500 mt-1">Name on the bank account</p>
              </div>

              {/* Account Number and Branch Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Account Number *
                  </label>
                  <Input
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 1234567890"
                    className="text-base font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">Your bank account number</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Branch Code (Optional)
                  </label>
                  <Input
                    name="branchCode"
                    value={formData.branchCode}
                    onChange={handleInputChange}
                    placeholder="e.g., 250155"
                    className="text-base font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">Bank branch code if applicable</p>
                </div>
              </div>

              {/* Payment Reference */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Payment Reference *
                </label>
                <Input
                  name="reference"
                  value={formData.reference}
                  onChange={handleInputChange}
                  placeholder="e.g., FISHORDER"
                  className="text-base font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Customers will use this as reference when making transfers. Use your order number or a unique identifier.
                </p>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Payment Instructions (Optional)
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  placeholder="e.g., Please include your order number in the payment reference. Payments are verified within 24 hours."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-sans"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Additional instructions to display to customers during payment
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <Button
                  onClick={handleSaveConfig}
                  disabled={isSaving || setPaymentConfigMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                >
                  {isSaving || setPaymentConfigMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => navigate("/admin")}
                  variant="outline"
                  className="flex-1 py-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Preview Card */}
        {formData.bankName && (
          <Card className="p-8 mt-8 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Preview (How customers will see this)</h3>
            <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-600">Bank Name</p>
                <p className="text-slate-900 font-semibold">{formData.bankName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">Account Holder</p>
                <p className="text-slate-900 font-semibold">{formData.accountHolder}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">Account Number</p>
                <p className="text-slate-900 font-mono font-bold">{formData.accountNumber}</p>
              </div>
              {formData.branchCode && (
                <div>
                  <p className="text-xs font-semibold text-slate-600">Branch Code</p>
                  <p className="text-slate-900 font-mono font-bold">{formData.branchCode}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-600">Payment Reference</p>
                <p className="text-slate-900 font-mono font-bold">{formData.reference}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
