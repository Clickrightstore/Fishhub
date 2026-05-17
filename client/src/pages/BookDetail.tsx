import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BookOpen, Star, ChevronLeft, ShoppingCart, Heart, Loader2, Download, Send } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { cartStore } from "./Cart";

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  

  const bookId = parseInt(id || "0");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Declare all hooks BEFORE any conditional logic
  const { data: book, isLoading: bookLoading } = trpc.books.getById.useQuery(bookId, { enabled: isAuthenticated });
  const { data: reviews = [] } = trpc.reviews.getForBook.useQuery(bookId, { enabled: isAuthenticated });
  const { data: reviewStatus } = trpc.reviews.canUserReview.useQuery(bookId, { enabled: isAuthenticated });
  const submitReviewMutation = trpc.reviews.submitReview.useMutation();

  // Check if user is authenticated AFTER all hooks are declared
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Please Log In</h2>
          <p className="text-slate-600 mb-4">You need to log in to view book details.</p>
          <Button onClick={() => navigate("/")} className="bg-blue-700 hover:bg-blue-800">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Book not found</h2>
          <Button onClick={() => navigate("/library")} className="mt-4">
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const tableOfContents = book.tableOfContents ? JSON.parse(book.tableOfContents) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <button 
            onClick={() => navigate("/library")}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 mb-4 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Library
          </button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-12">
          {/* Book Cover & Purchase */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center shadow-xl">
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-24 h-24 text-slate-400" />
              )}
            </div>

            {/* Purchase Card */}
            <Card className="p-6 space-y-4 sticky top-20">
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  R{parseFloat(book.price?.toString() || "0").toFixed(2)}
                </div>
                <p className="text-slate-600 text-sm">One-time purchase</p>
              </div>

              <div className="space-y-3">
                {user?.role === "admin" ? (
                  <Button 
                    size="lg" 
                    className="w-full bg-green-700 hover:bg-green-800 text-white"
                    onClick={() => {
                      if (!book.fileUrl) {
                        toast.error("Book file not available for download");
                        return;
                      }
                      // Create a link to download the book
                      const link = document.createElement('a');
                      link.href = book.fileUrl;
                      link.download = `${book.title}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success(`Downloaded: ${book.title}`);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Free (Admin)
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("Please sign in to purchase");
                        return;
                      }
                      if (!book) return;
                      cartStore.addItem({
                        bookId: book.id,
                        title: book.title,
                        author: book.author,
                        price: parseFloat(book.price?.toString() || "0"),
                        coverImageUrl: book.coverImageUrl || undefined,
                      });
                      toast.success(`"${book.title}" added to cart!`, {
                        action: {
                          label: "View Cart",
                          onClick: () => navigate("/cart"),
                        },
                      });
                    }}
                  >
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </>
                  </Button>
                )}
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart className={`w-4 h-4 mr-2 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                </Button>
              </div>

              {/* Benefits */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Instant Access</p>
                    <p className="text-slate-600 text-xs">Download immediately after purchase</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Lifetime Access</p>
                    <p className="text-slate-600 text-xs">Access your purchase forever</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">30-Day Guarantee</p>
                    <p className="text-slate-600 text-xs">Full refund if not satisfied</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Book Details */}
          <div className="col-span-2 space-y-8">
            {/* Header Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {book.isFlagship && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                    Flagship Collection
                  </span>
                )}
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {book.category.replace("_", " ")}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                  {book.skillLevel}
                </span>
              </div>

              <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">
                {book.title}
              </h1>
              <p className="text-xl text-slate-600 mb-4">
                by {book.author}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(parseFloat(book.averageRating?.toString() || "0"))
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-slate-900">
                    {parseFloat(book.averageRating?.toString() || "0").toFixed(1)}
                  </span>
                </div>
                <span className="text-slate-600">
                  ({book.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                About This Book
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                {book.description || "A comprehensive guide to mastering fishing techniques and discovering world-class destinations."}
              </p>
            </div>

            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                  What's Inside
                </h2>
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <ul className="space-y-3">
                    {tableOfContents.map((chapter: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-blue-700 font-semibold text-sm mt-1">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-slate-700">{chapter}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Review Submission Section */}
            {isAuthenticated && reviewStatus?.canReview && (
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                  Share Your Review
                </h2>
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="space-y-4">
                    {/* Rating Stars */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Your Rating
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setReviewRating(star)}
                            className="transition"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= (hoverRating || reviewRating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Title */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Review Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Excellent guide for beginners"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        maxLength={100}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Review Content */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Your Review
                      </label>
                      <textarea
                        placeholder="Share your thoughts about this book..."
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        maxLength={2000}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {reviewContent.length}/2000 characters
                      </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={async () => {
                        if (!reviewRating || !reviewTitle.trim() || !reviewContent.trim()) {
                          toast.error("Please fill in all fields");
                          return;
                        }
                        setIsSubmittingReview(true);
                        try {
                          await submitReviewMutation.mutateAsync({
                            bookId,
                            rating: reviewRating,
                            title: reviewTitle,
                            content: reviewContent,
                          });
                          toast.success("Review submitted successfully!");
                          setReviewRating(0);
                          setReviewTitle("");
                          setReviewContent("");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Failed to submit review");
                        } finally {
                          setIsSubmittingReview(false);
                        }
                      }}
                      disabled={isSubmittingReview}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      {isSubmittingReview ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Review
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Reviews Section */}
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                Reader Reviews
              </h2>
              
              {reviews.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-slate-600">No reviews yet. Be the first to review this book!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {review.isVerifiedPurchase && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-900">
                            {review.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm">
                        {review.content}
                      </p>
                      <p className="text-slate-500 text-xs mt-3">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
