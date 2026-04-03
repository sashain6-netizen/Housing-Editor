import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useHousingStore } from "../store/appStore";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { houses, createHouse, deleteHouse, fetchHouses, isLoading, error } = useHousingStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [creatingHouse, setCreatingHouse] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [accessError, setAccessError] = useState(null);

  useEffect(() => {
    if (!user) {
      setAccessError("You need to be logged in to access this page.");
      return;
    }
    fetchHouses().catch((error) => {
      if (error.response?.status === 403) {
        setAccessError("You don't have permission to access the dashboard.");
      } else {
        setAccessError("Failed to load your houses. Please try again.");
      }
    });
  }, [user]);

  const handleCreateHouse = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a house name");
      return;
    }

    setCreatingHouse(true);
    try {
      const newHouse = await createHouse(formData.name, formData.description);
      navigate(`/editor/${newHouse.id}`);
    } catch (err) {
      console.error(err);
      setCreatingHouse(false);
    }
  };

  const handleDeleteHouse = async (houseId) => {
    if (!window.confirm("Are you sure you want to delete this house?")) {
      return;
    }

    setDeletingId(houseId);
    try {
      await deleteHouse(houseId);
    } catch (err) {
      console.error(err);
    }
    setDeletingId(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Show access error if any
  if (accessError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-2xl border border-slate-700 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">🔒 Access Denied</h1>
          <p className="text-slate-400 mb-6">{accessError}</p>
          <div className="flex gap-3 justify-center">
            <a 
              href="/" 
              className="inline-block px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded transition"
            >
              Home
            </a>
            <a 
              href="/login" 
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">🏠 My Houses</h1>
            <p className="text-slate-400 mt-1">
              Welcome, <span className="text-slate-200 font-semibold">{user?.name}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-600 rounded text-red-300">
            {error}
          </div>
        )}

        {/* Create House Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition flex items-center gap-2"
        >
          ➕ New House
        </button>

        {/* Houses Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-400">Loading your houses...</p>
          </div>
        ) : houses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">You don't have any houses yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Create Your First House
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {houses.map((house) => (
              <div
                key={house.id}
                className="bg-slate-700 rounded-lg border border-slate-600 hover:border-blue-500 transition p-4"
              >
                <h3 className="text-lg font-bold text-slate-100 mb-2">{house.name}</h3>
                <p className="text-slate-400 text-sm mb-4">
                  {house.description || "No description"}
                </p>
                <div className="text-xs text-slate-500 mb-4">
                  Last updated: {new Date(house.updatedAt).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/editor/${house.id}`)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHouse(house.id)}
                    disabled={deletingId === house.id}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white text-sm font-semibold rounded transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create House Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Create New House</h2>

            <form onSubmit={handleCreateHouse} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  House Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Awesome House"
                  className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your house..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 text-slate-100 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={creatingHouse}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded transition"
                >
                  {creatingHouse ? "Creating..." : "Create House"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: "", description: "" });
                  }}
                  className="flex-1 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
