import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProfileCompletion() {
  const { user, refresh } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Valid email is required");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
      });

      toast.success("Profile updated successfully!");
      
      // Refresh user data
      await refresh();
      
      // Redirect to library
      navigate("/library");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
            <p className="text-slate-600">
              Please provide your name and email to get started. This information is required to purchase books.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg font-medium transition"
            >
              {isSubmitting ? "Saving..." : "Continue to Library"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600">
            We'll use this information to process your book purchases and send you updates.
          </p>
        </div>
      </Card>
    </div>
  );
}
