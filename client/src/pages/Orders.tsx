import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ChevronLeft, Download, Package, Calendar, DollarSign, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  const { data: orders = [], isLoading } = trpc.orders.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: selectedOrder } = trpc.orders.getById.useQuery(selectedOrderId || 0, {
    enabled: selectedOrderId !== null,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Sign in to view orders</h2>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleDownload = async (book: any) => {
    if (!book || !book.downloadUrl) {
      toast.error("Download URL not available");
      return;
    }

    setIsDownloading(book.bookId);
    try {
      // Simulate download by opening the URL
      window.open(book.downloadUrl, "_blank");
      toast.success(`Downloading ${book.bookTitle}...`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download book");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 mb-4 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-600 mt-2">View your purchases and download your books</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-700 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading your orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-600 mb-6">
              Start building your fishing library by purchasing books
            </p>
            <Button onClick={() => navigate("/library")} className="bg-blue-700 hover:bg-blue-800">
              Browse Library
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card
                key={order.id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Order #{order.id}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${Number(order.totalAmount).toFixed(2)}
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {order.status}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderId(order.id);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>

                {/* Books in Order */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Books in this order:</h4>
                  <div className="space-y-2">
                    {order.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{item.bookTitle}</p>
                          <p className="text-sm text-slate-600">
                            R{Number(item.priceAtPurchase).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                          disabled={isDownloading === item.bookId}
                          className="bg-blue-700 hover:bg-blue-800"
                        >
                          {isDownloading === item.bookId ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrderId !== null && selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrderId(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Order Details</h2>
                  <p className="text-slate-600 mt-1">Order #{selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded">
                  <div>
                    <p className="text-sm text-slate-600">Order Date</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Amount</p>
                    <p className="font-semibold text-slate-900">
                      ${Number(selectedOrder.totalAmount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <p className="font-semibold text-green-700">{selectedOrder.status}</p>
                  </div>
                </div>

                {/* Books */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Books Purchased</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{item.bookTitle}</p>
                          <p className="text-sm text-slate-600">
                            {item.bookDescription?.substring(0, 100)}...
                          </p>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            R{Number(item.priceAtPurchase).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(item)}
                          disabled={isDownloading === item.bookId}
                          className="bg-blue-700 hover:bg-blue-800 flex-shrink-0"
                        >
                          {isDownloading === item.bookId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close Button */}
                <Button
                  onClick={() => setSelectedOrderId(null)}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
