import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ChevronLeft, Plus, Heart, MessageCircle, Share2, Camera, MapPin, Calendar, Fish, Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Community() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showNewPost, setShowNewPost] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    species: "",
    location: "",
    weight: "",
    length: "",
    catchDate: "",
    description: "",
  });

  const { data: posts = [] } = trpc.community.getPosts.useQuery({ limit: 50 });
  const { data: userPosts = [] } = trpc.community.getUserPosts.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitPostMutation = trpc.community.submitPost.useMutation({
    onSuccess: () => {
      toast.success("Catch posted successfully!");
      setShowNewPost(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to post catch");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      species: "",
      location: "",
      weight: "",
      length: "",
      catchDate: "",
      description: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmitPost = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!formData.species.trim() || !formData.location.trim()) {
      toast.error("Please fill in species and location");
      return;
    }

    setIsUploading(true);
    try {
      let photoUrl = null;

      // Upload photo if selected
      if (photoFile) {
        const formDataForUpload = new FormData();
        formDataForUpload.append("file", photoFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataForUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error("Photo upload failed");
        }

        const uploadData = await uploadResponse.json();
        photoUrl = uploadData.url;
      }

      await submitPostMutation.mutateAsync({
        species: formData.species,
        location: formData.location,
        weight: formData.weight ? parseInt(formData.weight) : null,
        length: formData.length ? parseInt(formData.length) : null,
        catchDate: formData.catchDate ? new Date(formData.catchDate) : new Date(),
        description: formData.description,
        photoUrl,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 mb-4 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">
                Trophy Board
              </h1>
              <p className="text-slate-600">
                Celebrate amazing catches from our fishing community
              </p>
            </div>
            {isAuthenticated && (
              <Button 
                size="lg"
                className="bg-blue-700 hover:bg-blue-800"
                onClick={() => setShowNewPost(!showNewPost)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Share Your Catch
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-12">
        {/* New Post Form */}
        {showNewPost && isAuthenticated && (
          <Card className="p-8 mb-12 bg-white">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">
              Share Your Catch
            </h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Species *
                </label>
                <Input 
                  name="species"
                  placeholder="e.g., Marlin, Tuna, Bass"
                  value={formData.species}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Location *
                </label>
                <Input 
                  name="location"
                  placeholder="e.g., Costa Rica, Gulf of Mexico"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Weight (lbs)
                </label>
                <Input 
                  name="weight"
                  type="number"
                  placeholder="e.g., 250"
                  value={formData.weight}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Length (inches)
                </label>
                <Input 
                  name="length"
                  type="number"
                  placeholder="e.g., 72"
                  value={formData.length}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Catch Date
                </label>
                <Input 
                  name="catchDate"
                  type="date"
                  value={formData.catchDate}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Photo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    {photoFile ? photoFile.name : "Click to upload photo"}
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Preview */}
            {photoPreview && (
              <div className="mb-6">
                <img src={photoPreview} alt="Preview" className="max-w-xs rounded-lg" />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Description
              </label>
              <textarea 
                name="description"
                placeholder="Tell us about your catch..."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                size="lg"
                className="bg-blue-700 hover:bg-blue-800"
                onClick={handleSubmitPost}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Catch"
                )}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => {
                  setShowNewPost(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Login Prompt */}
        {!isAuthenticated && (
          <Card className="p-8 mb-12 bg-blue-50 border-blue-200">
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
                Join Our Fishing Community
              </h2>
              <p className="text-slate-600 mb-6">
                Sign in to share your catches, connect with other anglers, and showcase your trophy fish!
              </p>
              <Button 
                size="lg"
                className="bg-blue-700 hover:bg-blue-800"
                onClick={() => window.location.href = getLoginUrl()}
              >
                Sign In to Join
              </Button>
            </div>
          </Card>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-2 gap-8">
          {posts.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Fish className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No catches yet
              </h3>
              <p className="text-slate-600 mb-4">
                Be the first to share your amazing catch!
              </p>
              {isAuthenticated && (
                <Button 
                  className="bg-blue-700 hover:bg-blue-800"
                  onClick={() => setShowNewPost(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share Your Catch
                </Button>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Post Image */}
                {post.photoUrl && (
                  <div className="aspect-video bg-slate-200 overflow-hidden">
                    <img src={post.photoUrl} alt={post.species} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 mb-1">
                      {post.species}
                    </h3>
                    {post.weight && (
                      <p className="text-lg font-semibold text-blue-700">
                        {post.weight} lbs
                        {post.length && ` • ${post.length} inches`}
                      </p>
                    )}
                  </div>

                  {/* Location & Date */}
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {post.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.catchDate || post.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Description */}
                  {post.description && (
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {post.description}
                    </p>
                  )}

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-600 border-t border-slate-200 pt-4">
                    <button className="flex items-center gap-1 hover:text-red-500 transition">
                      <Heart className="w-4 h-4" />
                      {post.likes || 0}
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-700 transition">
                      <MessageCircle className="w-4 h-4" />
                      Comments
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-700 transition ml-auto">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
