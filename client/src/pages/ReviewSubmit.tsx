import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Star } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function ReviewSubmit() {
  const { bookId } = useParams<{ bookId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: book } = trpc.books.getById.useQuery(parseInt(bookId || "0"), {
    enabled: !!bookId,
  });

  const submitReviewMutation = trpc.reviews.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      navigate(`/book/${bookId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReviewMutation.mutateAsync({
        bookId: parseInt(bookId || "0"),
        rating,
        title,
        content,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <button 
            onClick={() => navigate(`/book/${bookId}`)}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 mb-4 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Book
          </button>
          <h1 className="text-4xl font-serif font-bold text-slate-900">
            Write a Review
          </h1>
          {book && (
            <p className="text-slate-600 mt-2">
              Share your thoughts on "{book.title}"
            </p>
          )}
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8">
          <form onSubmit={handleSubmit}>
            {/* Rating */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-900 mb-4">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Review Title
              </label>
              <Input
                type="text"
                placeholder="e.g., Excellent guide for beginners"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-slate-500 mt-1">
                {title.length}/100 characters
              </p>
            </div>

            {/* Content */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Your Review
              </label>
              <textarea
                placeholder="Share your detailed thoughts about this book..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                maxLength={2000}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <p className="text-xs text-slate-500 mt-1">
                {content.length}/2000 characters
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                size="lg"
                className="bg-blue-700 hover:bg-blue-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => navigate(`/book/${bookId}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
