import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ChevronLeft, Search, Download, Trash2, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 25;

export default function AdminNewsletterSubscribers() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = trpc.newsletterAdmin.getStats.useQuery();

  // Fetch paginated subscribers
  const { data: subscribersData, isLoading: subscribersLoading, refetch } = trpc.newsletterAdmin.getSubscribers.useQuery({
    isActive: filterActive,
    search: searchQuery || undefined,
    limit: ITEMS_PER_PAGE,
    offset: currentPage * ITEMS_PER_PAGE,
  });

  // Fetch all for export
  const { data: exportData } = trpc.newsletterAdmin.getAllForExport.useQuery();

  const handleExportClick = () => {
    if (!exportData) {
      toast.error("No data to export");
      return;
    }

    try {
      // Create CSV
      const headers = ["Email", "Name", "Status", "Subscribed Date"];
      const rows = exportData.map((sub: any) => [
        sub.email,
        sub.name || "N/A",
        sub.isActive ? "Active" : "Inactive",
        new Date(sub.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: any[]) => row.map((cell: string) => `"${cell}"`).join(",")),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Exported successfully!");
    } catch (error) {
      toast.error("Failed to export subscribers");
    }
  };

  // Delete subscriber
  const { mutate: deleteSubscriber } = trpc.newsletterAdmin.deleteSubscriber.useMutation({
    onSuccess: () => {
      toast.success("Subscriber deleted");
      setDeletingEmail(null);
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete subscriber");
      setDeletingEmail(null);
    },
  });

  const subscribers = subscribersData?.subscribers || [];
  const total = subscribersData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleDelete = (email: string) => {
    if (window.confirm(`Delete ${email} from newsletter?`)) {
      setDeletingEmail(email);
      deleteSubscriber(email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-blue-700 hover:text-blue-800 mb-4 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin
        </button>
        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2">
          Newsletter Subscribers
        </h1>
        <p className="text-slate-600">
          Manage and view all newsletter subscribers
        </p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-slate-600 text-sm font-medium mb-1">Total Subscribers</p>
            <p className="text-3xl font-bold text-slate-900">{stats?.total || 0}</p>
          </Card>
          <Card className="p-6">
            <p className="text-slate-600 text-sm font-medium mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">{stats?.active || 0}</p>
          </Card>
          <Card className="p-6">
            <p className="text-slate-600 text-sm font-medium mb-1">Inactive</p>
            <p className="text-3xl font-bold text-slate-400">{stats?.inactive || 0}</p>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card className="p-6 mb-8">
        <div className="space-y-4">
          {/* Search and Filter Row */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Search by Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-40">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Status
              </label>
              <select
                value={filterActive === undefined ? "all" : filterActive ? "active" : "inactive"}
                onChange={(e) => {
                  if (e.target.value === "all") setFilterActive(undefined);
                  else if (e.target.value === "active") setFilterActive(true);
                  else setFilterActive(false);
                  setCurrentPage(0);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <Button
              onClick={handleExportClick}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Results Info */}
          <div className="text-sm text-slate-600">
            Showing {subscribers.length > 0 ? currentPage * ITEMS_PER_PAGE + 1 : 0} to{" "}
            {Math.min((currentPage + 1) * ITEMS_PER_PAGE, total)} of {total} subscribers
          </div>
        </div>
      </Card>

      {/* Subscribers Table */}
      <Card className="overflow-hidden">
        {subscribersLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-700" />
            <p className="text-slate-600">Loading subscribers...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600">No subscribers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Subscribed
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.email} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {subscriber.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {subscriber.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          subscriber.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {subscriber.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(subscriber.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(subscriber.email)}
                        disabled={deletingEmail === subscriber.email}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 transition"
                      >
                        {deletingEmail === subscriber.email ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = currentPage > 2 ? currentPage - 2 + i : i;
              if (pageNum >= totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pageNum === currentPage
                      ? "bg-blue-700 text-white"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
