import { useNavigate } from "react-router-dom";
import { LogOut, Leaf } from "lucide-react";

import { logoutUser } from "../firebase/auth";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <header className="border-b bg-white">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Leaf size={22} />
            </div>

            <div>
              <h1 className="font-bold text-gray-900">
                MealRescue
              </h1>

              <p className="text-xs text-gray-500">
                Canteen Dashboard
              </p>
            </div>

          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        <div className="bg-white rounded-2xl border p-8">

          <h2 className="text-2xl font-bold text-gray-900">
            Login successful 🎉
          </h2>

          <p className="text-gray-500 mt-2">
            Your MealRescue dashboard will be built here.
          </p>

        </div>

      </main>

    </div>
  );
}