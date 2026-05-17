import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { BookOpen, Search, Star, Fish, ShoppingCart, ChevronRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import React from "react";
import { cartStore } from "./Cart";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "deep_sea", label: "Deep Sea" },
  { value: "fly_fishing", label: "Fly Fishing" },
  { value: "freshwater", label: "Freshwater" },
  { value: "saltwater", label: "Saltwater" },
  { value: "ice_fishing", label: "Ice Fishing" },
  { value: "general", label: "General" },
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export default function Library() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string | undefined>();
  const [cartCount, setCartCount] = React.useState(() => cartStore.getCount());

  React.useEffect(() => {
    return cartStore.subscribe(() => setCartCount(cartStore.getCount()));
  }, []);

  const { data: books = [] } = trpc.books.list.useQuery(
    { category: selectedCategory, skillLevel: selectedSkillLevel },
    { enabled: !!user }
  );
  const { data: searchResults = [] } = trpc.books.search.useQuery(searchQuery, {
    enabled: searchQuery.length > 0 && !!user,
  });

  const displayBooks = searchQuery.length > 0 ? searchResults : books;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="container max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center group-hover:bg-blue-800 transition">
              <Fish className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">FishHub</span>
          </button>
          <div className="flex items-center gap-8">
            {[{ label: "Library", path: "/library" }, { label: "Community", path: "/community" }, { label: "Destinations", path: "/destinations" }].map(({ label, path }) => (
              <button key={path} onClick={() => navigate(path)} className={`font-medium text-sm transition ${path === "/library" ? "text-blue-700" : "text-slate-600 hover:text-blue-700"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button onClick={() => navigate("/cart")} className="relative p-2 text-slate-600 hover:text-blue-700 transition">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-700 text-white text-xs rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
              </button>
            )}
            {isAuthenticated ? (
              <button onClick={() => navigate("/profile")} className="text-sm text-slate-700 hover:text-blue-700 transition font-medium">{user?.name?.split(" ")[0] || "Profile"}</button>
            ) : (
              <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-sm" onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 py-14">
        <div className="container max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-white mb-2">Fishing Book Library</h1>
          <p className="text-blue-200">Discover premium ebooks covering every fishing technique and destination</p>
        </div>
      </div>

      {!user ? (
        <div className="flex items-center justify-center py-32">
          <Card className="p-10 text-center max-w-sm w-full shadow-lg border-0">
            <BookOpen className="w-12 h-12 text-blue-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to browse</h2>
            <p className="text-slate-500 mb-6 text-sm">Create an account or sign in to access the full library.</p>
            <Button className="w-full bg-blue-700 hover:bg-blue-800" onClick={() => window.location.href = getLoginUrl()}>Sign In</Button>
          </Card>
        </div>
      ) : (
        <div className="container max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="space-y-5">
              {/* Search */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm mb-3">Search</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search books..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 text-sm" />
                </div>
              </div>

              {/* Category */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm mb-3">Category</h3>
                <div className="space-y-1">
                  <button onClick={() => setSelectedCategory(undefined)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!selectedCategory ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-200"}`}>All Categories</button>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.value} onClick={() => setSelectedCategory(cat.value)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedCategory === cat.value ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-200"}`}>{cat.label}</button>
                  ))}
                </div>
              </div>

              {/* Skill Level */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm mb-3">Skill Level</h3>
                <div className="space-y-1">
                  <button onClick={() => setSelectedSkillLevel(undefined)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!selectedSkillLevel ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-200"}`}>All Levels</button>
                  {SKILL_LEVELS.map((level) => (
                    <button key={level.value} onClick={() => setSelectedSkillLevel(level.value)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedSkillLevel === level.value ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-200"}`}>{level.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Books Grid */}
            <div className="col-span-3">
              {displayBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <BookOpen className="w-12 h-12 text-slate-200 mb-4" />
                  <h3 className="font-bold text-slate-700 mb-1">No books found</h3>
                  <p className="text-slate-400 text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-5">
                  {displayBooks.map((book) => (
                    <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-all border border-slate-100 group flex flex-col">
                      <div
                        className="aspect-[3/4] bg-slate-100 overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/book/${book.id}`)}
                      >
                        {book.coverImageUrl ? (
                          <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        {book.isFlagship && (
                          <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded mb-2">Flagship</span>
                        )}
                        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2 cursor-pointer hover:text-blue-700 transition" onClick={() => navigate(`/book/${book.id}`)}>{book.title}</h3>
                        <p className="text-xs text-slate-500 mb-2">by {book.author}</p>
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < Math.round(parseFloat(book.averageRating?.toString() || "0")) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                          ))}
                          <span className="text-xs text-slate-400 ml-1">({book.reviewCount})</span>
                        </div>
                        <div className="flex gap-1.5 mb-3">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{book.category.replace("_", " ")}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{book.skillLevel}</span>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="font-bold text-slate-900">R{parseFloat(book.price?.toString() || "0").toFixed(2)}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs px-3" onClick={() => navigate(`/book/${book.id}`)}>View</Button>
                            <Button
                              size="sm"
                              className="text-xs px-3 bg-blue-700 hover:bg-blue-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                cartStore.addItem({
                                  bookId: book.id,
                                  title: book.title,
                                  author: book.author,
                                  price: parseFloat(book.price?.toString() || "0"),
                                  coverImageUrl: book.coverImageUrl || undefined,
                                });
                                toast.success(`Added to cart!`, {
                                  action: { label: "View Cart", onClick: () => navigate("/cart") },
                                });
                              }}
                            >
                              <ShoppingCart className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
