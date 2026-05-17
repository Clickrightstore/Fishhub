import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, Loader2, Check } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setEmail("");
      setName("");
      setIsSubmitted(true);
      toast.success("Welcome to our newsletter!");
      
      // Reset the submitted state after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to subscribe. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    await subscribe.mutateAsync({ email: email.trim(), name: name.trim() || undefined });
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Check className="w-5 h-5" />
        <span className="font-medium">Thanks for subscribing!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="newsletter-name" className="text-sm font-medium text-slate-700">
          Name (optional)
        </label>
        <Input
          id="newsletter-name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={subscribe.isPending}
          className="bg-white"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="newsletter-email" className="text-sm font-medium text-slate-700">
          Email Address
        </label>
        <div className="flex gap-2">
          <Input
            id="newsletter-email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribe.isPending}
            className="bg-white flex-1"
          />
          <Button
            type="submit"
            disabled={subscribe.isPending || !email.trim()}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            {subscribe.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        We'll send you updates about new fishing guides, exclusive tips, and special offers. Unsubscribe anytime.
      </p>
    </form>
  );
}
