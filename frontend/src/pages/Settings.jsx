import { useNavigate } from "react-router-dom";

function SettingsPage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("USER_NAME") || "User";

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    localStorage.removeItem("USER_ID");
    localStorage.removeItem("USER_NAME");
    window.location.href = "/login";
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-800">Settings</h2>
        <p className="mt-2 text-sm text-gray-500">
          Manage your account and application preferences.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800">Profile Details</h3>
            <p className="mt-1 text-sm text-gray-600">Logged in as: <span className="font-semibold text-gray-900">{userName}</span></p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Account Actions</h3>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SettingsPage;
