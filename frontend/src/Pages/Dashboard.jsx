import React, { useEffect, useState } from "react";
import { FiHome, FiFileText, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export default function DashboardPage({ isDark }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handlers in component scope
  async function handleLogout() {
    try {
      await fetch(`${backendUrl}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {}
    try {
      if (logout) logout();
    } catch (e) {}
    navigate("/", { replace: true });
  }

  function handleHome() {
    navigate("/");
  }

  const SIDEBAR_LINKS = [
    { icon: <FiHome />, label: "Home", action: handleHome },
    // Optionally add Notes, Settings, etc.
    { icon: <FiLogOut />, label: "Logout", action: handleLogout },
  ];

  useEffect(() => {
    async function fetchNotes() {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/api/notes`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch notes");
        const data = await res.json();
        setNotes(data);
      } catch (err) {
        setError(err.message || "Error fetching notes");
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, []);

  if (loading)
    return <div className="p-10 text-xl text-center">Loading your dashboard...</div>;
  if (error)
    return (
      <div className="p-10 text-red-600 text-center font-semibold">
        Error: {error}
      </div>
    );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gradient-to-b from-gray-950 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-coral-50'} flex`}>
      {/* Sidebar */}
      <aside className={`w-[320px] min-h-screen rounded-r-3xl flex flex-col px-8 py-12 items-center ${isDark ? 'bg-gray-900 border-r border-gray-800 shadow-inner' : 'bg-white shadow-2xl border-r border-blue-100'}`}>
        <div
          className="w-24 h-24 rounded-full shadow mb-5 bg-blue-600 flex items-center justify-center text-white text-3xl font-semibold"
          aria-hidden
        >
          {(user?.fullname || user?.name || user?.email || "U").charAt(0).toUpperCase()}
        </div>
        <div className={`font-bold text-xl text-center mb-1 w-full truncate ${isDark ? 'text-gray-100' : 'text-blue-800'}`}>
          {user?.fullname || user?.name || "Your Name"}
        </div>
        <div className={`text-base mb-8 w-full text-center truncate ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
          {user?.email || "user@email.com"}
        </div>
        <nav className="flex flex-col gap-4 mt-2 w-full">
          {SIDEBAR_LINKS.map((link) => (
            <button
              onClick={link.action}
              key={link.label}
              className={`flex items-center gap-3 font-medium px-4 py-3 rounded-lg transition ${isDark ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-blue-50 text-blue-800 hover:text-blue-700'}`}
              style={{ fontSize: "1.05rem" }}
              type="button"
            >
              <span className="text-xl">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>
        <div className="flex-1" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-start bg-transparent p-12">
        <div className="w-full max-w-5xl">
          <div className="flex items-center mb-8">
            <span className="mr-3 text-4xl">📁</span>
            <h1 className={`text-3xl lg:text-4xl font-bold ${isDark ? 'text-gray-100' : 'text-blue-800'}`}>
              Your Saved Notes
            </h1>
          </div>
          {notes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8 w-full">
              {notes.map(({ _id, title, fileUrl, createdAt }) => (
                <div
                  key={_id}
                  className={`rounded-xl p-6 transition ${isDark ? 'bg-gray-800 border border-gray-700 text-gray-100 shadow-sm' : 'bg-blue-50 border border-blue-100 shadow hover:bg-blue-100'}`}
                >
                  <div>
                    <h2 className="text-lg font-semibold text-blue-700 mb-2 truncate">
                      {title}
                    </h2>
                    <p className="break-words text-gray-600 text-xs">
                      <span className="font-medium">File: </span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline break-all"
                      >
                        {fileUrl}
                      </a>
                    </p>
                  </div>
                  <p className="mt-4 text-right text-gray-400 text-xs">
                    Saved: {new Date(createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-12 text-lg">
              You have no saved notes yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
