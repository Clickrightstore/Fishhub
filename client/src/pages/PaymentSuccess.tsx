import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Download, FileText, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/success?session_id=:sessionId");
  const sessionId = params?.sessionId;
  const [loading, setLoading] = useState(true);

  // Fetch checkout session details
  const { data: session } = trpc.payments.getCheckoutSession.useQuery(
    sessionId || "",
    { enabled: !!sessionId }
  );

  // Fetch user's orders
  const { data: orders } = trpc.orders.list.useQuery();

  useEffect(() => {
    if (session) {
      setLoading(false);
    }
  }, [session]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Please Sign In</h1>
          <p className="text-slate-600 mb-6">
            You need to be signed in to view your order and download your ebooks.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  // Get the most recent order with items
  const latestOrder = orders?.[0] as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-slate-900">Fishing Community</span>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Success Content */}
      <div className="container max-w-4xl mx-auto px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full blur-lg"></div>
              <CheckCircle className="w-20 h-20 text-green-600 relative" />
            </div>
          </div>
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-3">
            Payment Successful!
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            Thank you for your purchase, {user.name}!
          </p>
          <p className="text-slate-500">
            Your ebooks are ready to download immediately below.
          </p>
        </div>

        {/* Order Summary */}
        {latestOrder && (
          <Card className="mb-8 p-8 bg-white border-2 border-green-100">
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-slate-900">#{latestOrder.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Order Date</p>
                <p className="text-2xl font-bold text-slate-900">
                  {new Date(latestOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-600 mb-3">Items Purchased</p>
              <div className="space-y-3">
                {(latestOrder?.items as any[])?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-900">{item.bookTitle}</p>
                        <p className="text-sm text-slate-600">PDF Ebook</p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-900">R{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Download Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
            Download Your Ebooks
          </h2>
          <div className="grid gap-6">
            {(latestOrder?.items as any[])?.map((item: any) => (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-24 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-12 h-12 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {item.bookTitle}
                      </h3>
                      <p className="text-slate-600 mb-4">
                        Premium fishing guide in PDF format. Instant download available.
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>📄 PDF Format</span>
                        <span>📖 Complete Guide</span>
                        <span>✓ Lifetime Access</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 ml-4">
                    <Button 
                      className="bg-blue-700 hover:bg-blue-800 text-white whitespace-nowrap"
                      onClick={() => {
                        // Download the ebook
                        if (item.downloadUrl) {
                          window.open(item.downloadUrl, '_blank');
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Now
                    </Button>
                    <p className="text-xs text-slate-500 text-center">
                      Click to download PDF
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">What's Next?</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900">Download Your Ebooks</p>
                <p className="text-sm text-slate-600">Click the download button above to get your PDF files immediately.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-900">Check Your Email</p>
                <p className="text-sm text-slate-600">A confirmation email with download links has been sent to {user.email}.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-900">Start Learning</p>
                <p className="text-sm text-slate-600">Open your ebook and begin mastering your fishing skills today!</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate("/library")}
              variant="outline"
            >
              Browse More Books
            </Button>
            <Button 
              onClick={() => navigate("/community")}
              className="bg-blue-700 hover:bg-blue-800"
            >
              Join Community <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* Support */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-3">
            Need help? Check your order history or contact support.
          </p>
          <Button 
            variant="outline"
            onClick={() => navigate("/profile")}
          >
            View Order History
          </Button>
        </div>
      </div>
    </div>
  );
}
