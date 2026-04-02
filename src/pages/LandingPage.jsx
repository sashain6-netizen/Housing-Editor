import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/appStore";

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">🏠 Housing Editor</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded font-semibold transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Visual <span className="text-blue-400">HTSL</span> Editor
          <br />
          for Hypixel Housing
        </h2>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Design your house scripts visually. Edit code directly. Sync automatically.
          All tied to your account.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition transform hover:scale-105"
          >
            Start Building →
          </button>
          <button
            onClick={() => document.getElementById("features").scrollIntoView()}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition"
          >
            Learn More
          </button>
        </div>

        {/* Screenshot placeholder */}
        <div className="rounded-lg border border-slate-600 bg-slate-800 p-8 mb-20 shadow-2xl">
          <div className="bg-slate-900 rounded h-96 flex items-center justify-center">
            <p className="text-slate-500 text-lg">Editor Preview Coming Soon</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Features</h3>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-3">📊</div>
            <h4 className="text-xl font-bold mb-2">Visual Editor</h4>
            <p className="text-slate-400">
              Drag-and-drop nodes to build your HTSL scripts. No coding required.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-3">📝</div>
            <h4 className="text-xl font-bold mb-2">Code Editor</h4>
            <p className="text-slate-400">
              Edit HTSL code directly. Changes sync with the visual editor.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-3">🔄</div>
            <h4 className="text-xl font-bold mb-2">Two-Way Sync</h4>
            <p className="text-slate-400">
              Edit visual or code. Changes automatically sync both ways.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-3">👤</div>
            <h4 className="text-xl font-bold mb-2">Account System</h4>
            <p className="text-slate-400">
              Create an account. Save and manage all your houses.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-3">☁️</div>
            <h4 className="text-xl font-bold mb-2">Cloud Storage</h4>
            <p className="text-slate-400">
              All your scripts backed up on our servers. Access anywhere.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-3">⚡</div>
            <h4 className="text-xl font-bold mb-2">Real-Time</h4>
            <p className="text-slate-400">
              Auto-save as you work. No more losing your progress.
            </p>
          </div>
        </div>
      </section>

      {/* Node Types */}
      <section className="bg-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Supported Node Types</h3>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-blue-600 text-white rounded-lg p-4 mb-3">
                <h4 className="font-bold">📌 Event Nodes</h4>
              </div>
              <ul className="text-slate-300 space-y-1 text-sm">
                <li>• PlayerJoin</li>
                <li>• PlayerKill</li>
                <li>• PlayerDeath</li>
                <li>• PlayerMove</li>
                <li>• BlockClick</li>
              </ul>
            </div>

            <div>
              <div className="bg-green-600 text-white rounded-lg p-4 mb-3">
                <h4 className="font-bold">⚙️ Action Nodes (8 types)</h4>
              </div>
              <ul className="text-slate-300 space-y-1 text-sm">
                <li>• SendMessage</li>
                <li>• GiveItem</li>
                <li>• Teleport</li>
                <li>• SetStat</li>
                <li>• PlaySound & more</li>
              </ul>
            </div>

            <div>
              <div className="bg-purple-600 text-white rounded-lg p-4 mb-3">
                <h4 className="font-bold">🔀 Condition Nodes (3 types)</h4>
              </div>
              <ul className="text-slate-300 space-y-1 text-sm">
                <li>• StatCheck</li>
                <li>• ItemCheck</li>
                <li>• TimeCheck</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to Build?</h3>
        <p className="text-slate-300 mb-6">Start creating your Hypixel housing scripts today.</p>
        <button
          onClick={() => navigate("/register")}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition transform hover:scale-105"
        >
          Create Your Account
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>🏠 Hypixel Housing HTSL Editor • Made for Housing Developers</p>
          <p className="mt-2">© 2026 All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
