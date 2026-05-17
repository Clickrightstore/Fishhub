import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Anchor, BookOpen, Users, MapPin, ChevronRight, Eye, ShoppingCart, Star, Fish, Award, Globe } from "lucide-react";
import React from "react";
import { NewsletterForm } from "@/components/NewsletterForm";
import { cartStore } from "./Cart";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: flagshipBook } = trpc.books.getFlagship.useQuery();
  const { data: communityPosts } = trpc.community.getPosts.useQuery({ limit: 3 });
  const { data: siteStats } = trpc.stats.getSiteStats.useQuery();
  const [cartCount, setCartCount] = React.useState(() => cartStore.getCount());

  const incrementVisitor = trpc.stats.incrementVisitor.useMutation();
  React.useEffect(() => {
    incrementVisitor.mutate();
  }, []);

  React.useEffect(() => {
    return cartStore.subscribe(() => setCartCount(cartStore.getCount()));
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="container max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center group-hover:bg-blue-800 transition">
              <Fish className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">FishHub</span>
          </button>

          <div className="flex items-center gap-8">
            {[
              { label: "Library", path: "/library" },
              { label: "Community", path: "/community" },
              { label: "Destinations", path: "/destinations" },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="text-slate-600 hover:text-blue-700 font-medium text-sm transition"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 text-slate-600 hover:text-blue-700 transition"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-700 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/profile")}
                  className="text-sm text-slate-700 hover:text-blue-700 transition font-medium"
                >
                  {user?.name?.split(" ")[0] || "Profile"}
                </button>
                <Button size="sm" variant="outline" onClick={() => navigate(user?.role === "admin" ? "/admin" : "/orders")} className="text-sm">
                  {user?.role === "admin" ? "Admin" : "Orders"}
                </Button>
              </>
            ) : (
              <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-sm" onClick={() => window.location.href = getLoginUrl()}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative min-h-[88vh] flex items-center bg-cover bg-center"
        style={{ backgroundImage: "url('/manus-storage/s99P8vXD9n3p_c3ab2ab8.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 bg-blue-600/90 text-white text-xs font-semibold rounded-full mb-6 tracking-wide uppercase">
              Featured Collection
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Master the<br />
              <span className="text-blue-400">Deep Ocean</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Your complete guide to deep sea fishing. Proven techniques, world-class destinations, and trophy catches.
            </p>
            <div className="flex items-center gap-4 mb-10">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-semibold shadow-lg"
                onClick={() => navigate(`/book/${flagshipBook?.id || 1}`)}
              >
                Explore Now <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 backdrop-blur-sm"
                onClick={() => navigate("/library")}
              >
                Browse Library
              </Button>
            </div>
            <div className="flex items-center gap-8 text-white/70 text-sm">
              <div>
                <div className="text-white font-bold text-xl">R{flagshipBook?.price || 295}</div>
                <div>One-time price</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-white font-bold flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <div>500+ reviews</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <div className="text-white font-bold text-xl">30-Day</div>
                <div>Money-back guarantee</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flagship book card */}
        {flagshipBook && (
          <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 z-10">
            <div className="w-72 bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="aspect-[3/2] bg-slate-100 overflow-hidden">
                {flagshipBook.coverImageUrl ? (
                  <img src={flagshipBook.coverImageUrl} alt={flagshipBook.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm leading-snug">{flagshipBook.title}</h3>
                <p className="text-xs text-slate-500 mb-4">by {flagshipBook.author}</p>
                <Button
                  size="sm"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-xs"
                  onClick={() => navigate(`/book/${flagshipBook.id}`)}
                >
                  View Book
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-blue-700 py-6">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-4 text-center text-white">
            {[
              { label: "Premium Ebooks", value: "100+" },
              { label: "Active Members", value: `${siteStats?.totalVisitors || 5000}+` },
              { label: "Expert Guides", value: "50+" },
              { label: "Global Destinations", value: "30+" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-blue-200 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-slate-50">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything for the Modern Angler</h2>
            <p className="text-slate-500 text-lg">Discover, learn, and connect with fellow fishing enthusiasts</p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Curated Library",
                description: "Access 100+ premium fishing ebooks covering every technique, species, and destination worldwide.",
                image: "/manus-storage/CM2FWlaf4xDn_dc278092.jpg",
                action: () => navigate("/library"),
                cta: "Browse Library",
              },
              {
                icon: Users,
                title: "Active Community",
                description: "Share your catches, connect with 5,000+ anglers, and celebrate trophy moments together.",
                image: "/manus-storage/ceHa3Ob2KMXa_39f3616a.jpg",
                action: () => navigate("/community"),
                cta: "Join Community",
              },
              {
                icon: Globe,
                title: "Global Destinations",
                description: "Discover the world's best fishing spots with expert local insights and interactive maps.",
                image: "/manus-storage/UdRQAfzwBdNI_239f7a78.jpg",
                action: () => navigate("/destinations"),
                cta: "Explore Spots",
              },
            ].map(({ icon: Icon, title, description, image, action, cta }) => (
              <Card key={title} className="overflow-hidden hover:shadow-xl transition-shadow border-0 shadow-md group cursor-pointer" onClick={action}>
                <div className="aspect-video overflow-hidden bg-slate-200">
                  <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-7">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{description}</p>
                  <span className="text-blue-700 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    {cta} <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trophy Board ── */}
      <section className="py-24 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-700" />
                <span className="text-blue-700 font-semibold text-sm uppercase tracking-wide">Community</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900">Trophy Board</h2>
              <p className="text-slate-500 mt-2">Celebrating amazing catches from our community</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/community")} className="gap-2">
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {communityPosts?.slice(0, 3).map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow border border-slate-100">
                {post.photoUrl && (
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    <img src={post.photoUrl} alt={post.species} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900">{post.species}</h3>
                    {post.weight && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                        {post.weight} lbs
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {post.location}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(post.catchDate || post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-blue-700 py-20">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Elevate Your Fishing?</h2>
          <p className="text-blue-100 text-lg mb-8">Join thousands of anglers mastering the art of fishing</p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8" onClick={() => navigate("/library")}>
              Explore Library
            </Button>
            <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => navigate("/community")}>
              Join Community
            </Button>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-slate-50 py-20">
        <div className="container max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Stay Updated</h2>
          <p className="text-slate-500 mb-8">Get exclusive tips, new releases, and special offers in your inbox.</p>
          <NewsletterForm />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-14">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-5 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Fish className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">FishHub</span>
              </div>
              <p className="text-sm leading-relaxed">
                Your complete resource for mastering fishing. Premium ebooks, active community, and world-class destinations.
              </p>
            </div>
            {[
              { heading: "Explore", links: ["Library", "Community", "Destinations"] },
              { heading: "Account", links: ["Profile", "Orders", "Settings"] },
              { heading: "Legal", links: ["Privacy", "Terms", "Refund Policy"] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h4 className="text-white font-semibold text-sm mb-4">{heading}</h4>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-6 flex items-center justify-between text-sm">
            <p>&copy; 2026 FishHub. All rights reserved.</p>
            <div className="flex items-center gap-2 text-slate-500">
              <Eye className="w-4 h-4" />
              <span>{siteStats?.totalVisitors || 0} visitors</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
