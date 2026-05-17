import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, BookOpen, Trophy, Settings, LogOut } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: orders = [] } = trpc.orders.list.useQuery();
  const { data: communityPosts = [] } = trpc.community.getUserPosts.useQuery();

  const handleLogout = async () => {
    await logout();
    navigate("/");
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
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          {/* Profile Card */}
          <Card className="col-span-1 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">
              {user?.name || "User"}
            </h1>
            <p className="text-slate-600 mb-4">
              {user?.email}
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </Card>

          {/* Stats */}
          <div className="col-span-2 space-y-4">
            <Card className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Books Purchased</p>
                <p className="text-3xl font-bold text-slate-900">{orders.length}</p>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Catches Shared</p>
                <p className="text-3xl font-bold text-slate-900">{communityPosts.length}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Purchased Books */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
            Your Library
          </h2>
          {orders.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No books purchased yet
              </h3>
              <p className="text-slate-600 mb-4">
                Explore our library and start your fishing journey
              </p>
              <Button 
                className="bg-blue-700 hover:bg-blue-800"
                onClick={() => navigate("/library")}
              >
                Browse Library
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[3/4] bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-slate-400" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-600 mb-2">
                      Order #{order.id}
                    </p>
                    <p className="font-semibold text-slate-900 mb-2">
                      ${parseFloat(order.totalAmount?.toString() || "0").toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        order.status === "completed" ? "bg-green-500" : "bg-yellow-500"
                      }`}></div>
                      <span className="text-xs text-slate-600 capitalize">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Community Activity */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
            Your Catches
          </h2>
          {communityPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No catches shared yet
              </h3>
              <p className="text-slate-600 mb-4">
                Share your fishing adventures with the community
              </p>
              <Button 
                className="bg-blue-700 hover:bg-blue-800"
                onClick={() => navigate("/community")}
              >
                Share Your Catch
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {communityPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {post.photoUrl && (
                    <div className="aspect-video bg-slate-200 overflow-hidden">
                      <img src={post.photoUrl} alt={post.species} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {post.species}
                    </h3>
                    {post.weight && (
                      <p className="text-sm font-semibold text-blue-700 mb-2">
                        {post.weight} lbs
                      </p>
                    )}
                    <p className="text-sm text-slate-600 mb-3">
                      📍 {post.location}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded ${
                        post.status === "approved" 
                          ? "bg-green-100 text-green-700" 
                          : post.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {post.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {post.likes} likes
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
