import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { Menu, LogOut, Bell } from "lucide-react";

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setUser(payload);
            } catch {
                setUser(null);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* 🔹 Sabit Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                role={user?.role}
            />

            {/* 🔹 Sağ içerik alanı */}
            <div className="flex flex-col flex-1 md:ml-64 min-w-0 transition-all duration-300">
                {/* Üst Bar */}
                <header className="bg-white shadow flex justify-between items-center px-4 py-3 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-md hover:bg-gray-100 md:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-lg font-semibold text-indigo-700">
                            {user?.role === "admin"
                                ? "Yönetici Paneli"
                                : user?.role === "manager"
                                    ? "Okul Yönetimi"
                                    : "SmartQ"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-gray-600 hover:text-indigo-600">
                            <Bell size={20} />
                        </button>

                        {user && (
                            <span className="hidden sm:block text-gray-600 text-sm">
                                👋 {user.role?.toUpperCase()}
                            </span>
                        )}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                        >
                            <LogOut size={16} />
                            <span>Çıkış</span>
                        </button>
                    </div>
                </header>

                {/* 📊 İçerik alanı */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
