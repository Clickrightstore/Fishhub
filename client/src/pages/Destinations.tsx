import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ChevronLeft, MapPin, Fish, TrendingUp, Users } from "lucide-react";

const DESTINATIONS = [
  {
    id: 1,
    name: "Costa Rica",
    region: "Central America",
    image: "🌴",
    species: ["Marlin", "Tuna", "Wahoo"],
    difficulty: "Intermediate",
    rating: 4.8,
    reviews: 234,
    description: "World-class deep sea fishing with consistent marlin runs year-round.",
    bestSeason: "November - April",
    avgCatch: "200-400 lbs",
  },
  {
    id: 2,
    name: "Great Barrier Reef",
    region: "Australia",
    image: "🪸",
    species: ["Barramundi", "Queenfish", "Trevally"],
    difficulty: "Advanced",
    rating: 4.9,
    reviews: 189,
    description: "Pristine reef fishing with abundant tropical species and stunning scenery.",
    bestSeason: "May - October",
    avgCatch: "50-150 lbs",
  },
  {
    id: 3,
    name: "Alaska",
    region: "North America",
    image: "❄️",
    species: ["Salmon", "Halibut", "Cod"],
    difficulty: "Intermediate",
    rating: 4.7,
    reviews: 312,
    description: "Remote wilderness fishing with massive salmon runs and pristine waters.",
    bestSeason: "June - September",
    avgCatch: "30-100 lbs",
  },
  {
    id: 4,
    name: "New Zealand",
    region: "Oceania",
    image: "🏔️",
    species: ["Striped Marlin", "Kingfish", "Snapper"],
    difficulty: "Advanced",
    rating: 4.9,
    reviews: 156,
    description: "Epic big game fishing with crystal clear waters and world-record potential.",
    bestSeason: "December - April",
    avgCatch: "300-600 lbs",
  },
  {
    id: 5,
    name: "Florida Keys",
    region: "North America",
    image: "🏝️",
    species: ["Tarpon", "Permit", "Bonefish"],
    difficulty: "Expert",
    rating: 4.6,
    reviews: 428,
    description: "Legendary flats fishing with challenging species and technical angling.",
    bestSeason: "April - June",
    avgCatch: "50-200 lbs",
  },
  {
    id: 6,
    name: "Iceland",
    region: "Europe",
    image: "🌊",
    species: ["Arctic Char", "Brown Trout", "Sea Trout"],
    difficulty: "Beginner",
    rating: 4.5,
    reviews: 98,
    description: "Pristine freshwater and coastal fishing in one of the world's most beautiful locations.",
    bestSeason: "June - August",
    avgCatch: "10-30 lbs",
  },
];

const FILTERS = [
  { id: "all", label: "All Destinations" },
  { id: "saltwater", label: "Saltwater" },
  { id: "freshwater", label: "Freshwater" },
  { id: "beginner", label: "Beginner" },
  { id: "advanced", label: "Advanced" },
];

export default function Destinations() {
  const [, navigate] = useLocation();
  const [selectedFilter, setSelectedFilter] = useState("all");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 mb-4 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">
            World Fishing Destinations
          </h1>
          <p className="text-slate-600">
            Discover the world's best fishing spots with expert local insights
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-full font-semibold transition whitespace-nowrap ${
                selectedFilter === filter.id
                  ? "bg-blue-700 text-white"
                  : "bg-white border border-slate-300 text-slate-700 hover:border-blue-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-2 gap-8">
          {DESTINATIONS.map((destination) => (
            <Card key={destination.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Header with Image */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-8 text-center">
                <div className="text-6xl mb-4">{destination.image}</div>
                <h2 className="text-3xl font-serif font-bold text-white mb-1">
                  {destination.name}
                </h2>
                <p className="text-blue-100">
                  {destination.region}
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Description */}
                <p className="text-slate-600">
                  {destination.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Best Season</p>
                    <p className="font-semibold text-slate-900">{destination.bestSeason}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Avg. Catch</p>
                    <p className="font-semibold text-slate-900">{destination.avgCatch}</p>
                  </div>
                </div>

                {/* Species */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Target Species</p>
                  <div className="flex flex-wrap gap-2">
                    {destination.species.map((species) => (
                      <span key={species} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {species}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Difficulty & Rating */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Difficulty</p>
                    <p className="font-semibold text-slate-900">{destination.difficulty}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-bold text-slate-900">{destination.rating}</span>
                      <span className="text-amber-400">★</span>
                    </div>
                    <p className="text-xs text-slate-600">({destination.reviews} reviews)</p>
                  </div>
                </div>

                {/* CTA */}
                <Button className="w-full bg-blue-700 hover:bg-blue-800 mt-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-serif font-bold text-slate-900 mb-8">
            Interactive Map
          </h2>
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-slate-100 text-center">
            <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Interactive Map Coming Soon
            </h3>
            <p className="text-slate-600 mb-4">
              Explore fishing destinations on an interactive map with real-time conditions and local guides.
            </p>
            <Button className="bg-blue-700 hover:bg-blue-800">
              View Map
            </Button>
          </Card>
        </div>

        {/* Tips Section */}
        <div className="mt-16 grid grid-cols-3 gap-8">
          {[
            {
              icon: TrendingUp,
              title: "Plan Your Trip",
              description: "Check seasonal patterns and book your fishing adventure during peak season."
            },
            {
              icon: Users,
              title: "Connect with Locals",
              description: "Get insider tips from experienced anglers who know these waters best."
            },
            {
              icon: Fish,
              title: "Target Species",
              description: "Learn about the fish species you'll encounter and the best techniques to catch them."
            }
          ].map((tip, idx) => (
            <Card key={idx} className="p-6">
              <tip.icon className="w-8 h-8 text-blue-700 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2">{tip.title}</h3>
              <p className="text-slate-600 text-sm">{tip.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
