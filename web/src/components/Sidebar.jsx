import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    School,
    Users,
    GraduationCap,
    UserSquare2,
    BarChart3,
    X,
    UserCircle,
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen, role }) {
    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { name: "Okullar", icon: School, path: "/schools" },
        { name: "Öğretmenler", icon: Users, path: "/teachers" },
        { name: "Öğrenciler", icon: GraduationCap, path: "/students" },
        { name: "Veliler", icon: UserSquare2, path: "/parents" },
        { name: "Raporlar", icon: BarChart3, path: "/reports" },
    ];

    return (
        <>
            {/* 💻 Masaüstü Sidebar */}
            <aside
                className="hidden md:flex fixed top-0 left-0 flex-col bg-indigo-700 text-white w-64 h-full shadow-xl z-30"
            >
                {/* Üst Kısım */}
                <div className="p-6 flex flex-col items-center border-b border-indigo-500">
                    <UserCircle size={48} className="text-indigo-200 mb-2" />
                    <h1 className="text-xl font-bold tracking-wide">SmartQ</h1>
                    <p className="text-xs text-indigo-200 mt-1">
                        {role ? role.toUpperCase() : "Kullanıcı"}
                    </p>
                </div>

                {/* Menü */}
                <nav className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2 rounded-md transition-all ${isActive
                                    ? "bg-indigo-500 text-white font-medium"
                                    : "text-indigo-100 hover:bg-indigo-600 hover:text-white"
                                }`
                            }
                        >
                            <item.icon size={18} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Alt Bilgi */}
                <div className="p-4 text-xs text-indigo-200 border-t border-indigo-500 text-center">
                    Rol: {role || "Bilinmiyor"}
                </div>
            </aside>

            {/* 📱 Mobil Overlay */}
            <div
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${isOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                    }`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* 📱 Mobil Sidebar */}
            <aside
                className={`fixed top-0 left-0 bg-indigo-700 text-white w-64 h-full z-50 transform transition-transform duration-300 md:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex justify-between items-center p-4 border-b border-indigo-500">
                    <span className="text-xl font-bold">SmartQ</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-indigo-200 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2 rounded-md transition-all ${isActive
                                    ? "bg-indigo-500 text-white font-medium"
                                    : "text-indigo-100 hover:bg-indigo-600 hover:text-white"
                                }`
                            }
                        >
                            <item.icon size={18} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 text-xs text-indigo-200 border-t border-indigo-500 text-center">
                    Rol: {role || "Bilinmiyor"}
                </div>
            </aside>
        </>
    );
}
