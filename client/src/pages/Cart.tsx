import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";

// ─── Cart storage (in-memory, shared via module state) ───────────────────────
export interface CartItem {
  bookId: number;
  title: string;
  author: string;
  price: number;
  coverImageUrl?: string;
  quantity: number;
}

let cartItems: CartItem[] = [];
const listeners: Set<() => void> = new Set();

export const cartStore = {
  getItems: () => cartItems,
  addItem: (item: Omit<CartItem, "quantity">) => {
    const existing = cartItems.find(i => i.bookId === item.bookId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cartItems = [...cartItems, { ...item, quantity: 1 }];
    }
    listeners.forEach(fn => fn());
  },
  removeItem: (bookId: number) => {
    cartItems = cartItems.filter(i => i.bookId !== bookId);
    listeners.forEach(fn => fn());
  },
  updateQty: (bookId: number, qty: number) => {
    if (qty <= 0) {
      cartStore.removeItem(bookId);
      return;
    }
    cartItems = cartItems.map(i => i.bookId === bookId ? { ...i, quantity: qty } : i);
    listeners.forEach(fn => fn());
  },
  clear: () => {
    cartItems = [];
    listeners.forEach(fn => fn());
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getCount: () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
};

// ─── Cart Page Component ──────────────────────────────────────────────────────
export default function Cart() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => cartStore.getItems());
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "payfast">("stripe");
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep in sync with cart store
  useState(() => {
    const unsub = cartStore.subscribe(() => setItems([...cartStore.getItems()]));
    return unsub;
  });

  const createStripeSession = trpc.payments.createCheckoutSession.useMutation();

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  const bookIds = items.flatMap(i => Array(i.quantity).fill(i.bookId));

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to checkout");
      navigate("/");
      return;
    }
    if (items.length === 0) return;

    setIsProcessing(true);
    try {
      if (paymentMethod === "stripe") {
        const result = await createStripeSession.mutateAsync({
          bookIds: items.map(i => i.bookId),
          origin: window.location.origin,
        });
        if (result.url) {
          window.location.href = result.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      } else if (paymentMethod === "paypal") {
        toast.error("PayPal is not yet configured. Please use Stripe or PayFast.");
        setIsProcessing(false);
      } else if (paymentMethod === "payfast") {
        navigate(`/payfast-checkout?bookIds=${items.map(i => i.bookId).join(",")}&amount=${total.toFixed(2)}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Checkout failed. Please try again.");
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Please Sign In</h2>
          <p className="text-slate-600 mb-4">You need to sign in to view your cart.</p>
          <Button onClick={() => navigate("/")} className="bg-blue-700 hover:bg-blue-800 w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Back link */}
        <button
          onClick={() => navigate("/library")}
          className="flex items-center gap-2 text-blue-700 hover:text-blue-800 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </button>

        <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-700" />
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Your cart is empty</h2>
            <p className="text-slate-500 mb-6">Browse the library to add books</p>
            <Button onClick={() => navigate("/library")} className="bg-blue-700 hover:bg-blue-800">
              Browse Library
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.bookId} className="p-4 flex gap-4 items-center">
                  {/* Cover */}
                  <div className="w-20 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded overflow-hidden flex-shrink-0">
                    {item.coverImageUrl ? (
                      <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-1">
                        No cover
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{item.title}</h3>
                    <p className="text-sm text-slate-500">by {item.author}</p>
                    <p className="text-blue-700 font-bold mt-1">R{item.price.toFixed(2)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => cartStore.updateQty(item.bookId, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => cartStore.updateQty(item.bookId, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Item total + remove */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">
                      R{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => cartStore.removeItem(item.bookId)}
                      className="mt-2 text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-blue-700 text-white sticky top-6">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-blue-100">
                    <span>Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-100">
                    <span>Tax (15%)</span>
                    <span>R{tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-500 pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-blue-100 mb-3">Choose Payment Method:</p>
                  <div className="space-y-2">
                    {[
                      { id: "stripe" as const, label: "Stripe", sublabel: "Credit / Debit Card" },
                      { id: "payfast" as const, label: "PayFast", sublabel: "South African payments" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition text-left ${
                          paymentMethod === method.id
                            ? "border-white bg-blue-600"
                            : "border-blue-500 bg-blue-800 hover:bg-blue-600"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          paymentMethod === method.id ? "border-white bg-white" : "border-blue-300"
                        }`} />
                        <div>
                          <p className="font-semibold text-white text-sm">{method.label}</p>
                          <p className="text-blue-200 text-xs">{method.sublabel}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkout button */}
                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || items.length === 0}
                  className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 text-base"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>

                <p className="text-xs text-blue-200 text-center mt-4">
                  Secure payment powered by {paymentMethod === "payfast" ? "PayFast" : "Stripe"}
                </p>

                <p className="text-xs text-blue-200 text-center mt-2">
                  {items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""} in cart
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
