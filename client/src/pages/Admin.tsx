import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ChevronLeft, Plus, Edit2, Trash2, Eye, X, Check } from "lucide-react";

type AdminTab = "books" | "orders" | "moderation" | "newsletter" | "payments";

export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>("books");
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);
  const [showNewBookForm, setShowNewBookForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    description: "",
    category: "general",
    skillLevel: "beginner",
    fishingType: "both",
    price: "",
    isFlagship: false,
  });

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">You do not have permission to access the admin panel.</p>
          <Button onClick={() => navigate("/")} className="bg-blue-700 hover:bg-blue-800">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 mb-4 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-4xl font-serif font-bold text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            Manage books, orders, and community content
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          {[
            { id: "books" as const, label: "Books" },
            { id: "orders" as const, label: "Orders" },
            { id: "moderation" as const, label: "Moderation" },
            { id: "newsletter" as const, label: "Newsletter" },
            { id: "payments" as const, label: "Payments" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Books Tab */}
        {activeTab === "books" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                Manage Books
              </h2>
              <Button 
                className="bg-blue-700 hover:bg-blue-800"
                onClick={() => setShowNewBookForm(!showNewBookForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Book
              </Button>
            </div>

            {/* New Book Form */}
            {showNewBookForm && (
              <Card className="p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Add New Book
                  </h3>
                  <button onClick={() => setShowNewBookForm(false)}>
                    <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1">
                      Title
                    </label>
                    <Input 
                      placeholder="Book title"
                      value={newBook.title}
                      onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1">
                      Author
                    </label>
                    <Input 
                      placeholder="Author name"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1">
                      Category
                    </label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      <option>deep_sea</option>
                      <option>fly_fishing</option>
                      <option>freshwater</option>
                      <option>saltwater</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-1">
                      Price
                    </label>
                    <Input 
                      type="number"
                      placeholder="29.99"
                      value={newBook.price}
                      onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-900 mb-1">
                    Description
                  </label>
                  <textarea 
                    placeholder="Book description"
                    value={newBook.description}
                    onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <input 
                    type="checkbox"
                    checked={newBook.isFlagship}
                    onChange={(e) => setNewBook({...newBook, isFlagship: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-semibold text-slate-900">
                    Mark as Flagship Product
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button className="bg-blue-700 hover:bg-blue-800">
                    Create Book
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewBookForm(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Books List */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Author</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">Deep Sea Fishing: The Ultimate Guide</td>
                    <td className="px-6 py-4 text-slate-600">Expert Anglers</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">deep_sea</span></td>
                    <td className="px-6 py-4 font-semibold">$29.99</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded transition">
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded transition">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              Recent Orders
            </h2>
            <Card className="p-8 text-center">
              <p className="text-slate-600 mb-4">No orders yet. Orders will appear here once customers start purchasing.</p>
            </Card>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === "moderation" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              Moderate Community Posts
            </h2>
            <Card className="p-8 text-center">
              <p className="text-slate-600 mb-4">No pending posts to moderate.</p>
            </Card>
          </div>
        )}

        {activeTab === "newsletter" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                Newsletter Subscribers
              </h2>
              <Button 
                className="bg-blue-700 hover:bg-blue-800"
                onClick={() => navigate("/admin/newsletter")}
              >
                View All Subscribers
              </Button>
            </div>
            <Card className="p-8">
              <p className="text-slate-600">Manage newsletter subscribers, view statistics, and export subscriber lists.</p>
            </Card>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                Payment Management
              </h2>
              <Button 
                className="bg-blue-700 hover:bg-blue-800"
                onClick={() => navigate("/admin/payments")}
              >
                Manage Payments
              </Button>
            </div>
            <Card className="p-8">
              <p className="text-slate-600">Configure bank details, verify manual payments, and manage payment requests from customers.</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
