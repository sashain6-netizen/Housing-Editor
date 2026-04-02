import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/appStore";

export function ProtectedRoute({ children }) {
  const { user, token, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsChecking(false);
        return;
      }

      await checkAuth();
      setIsChecking(false);
    };

    verify();
  }, [token, checkAuth]);

  if (isChecking) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Loading...</p>
          <div className="inline-block animate-spin">⚙️</div>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
