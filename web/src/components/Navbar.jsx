import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        navigate("/login");
    };

    const menuItems = [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Okullar", path: "/schools" },
        { name: "Öğretmenler", path: "/teachers" },
        { name: "Öğrenciler", path: "/students" },
        { name: "Veliler", path: "/parents" },
    ];

    const baseStyle = "transition-colors font-medium";
    const inactiveStyle = "text-white/80 hover:text-white";
    const activeStyle = "text-yellow-300 border-b-2 border-yellow-300 pb-1";

    return (
        <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 shadow-md flex justify-between items-center">
            {/* Sol taraf: logo */}
            <h1
                className="font-bold text-lg cursor-pointer select-none"
                onClick={() => navigate("/dashboard")}
            >
                SmartQ
            </h1>

            {/* Orta: Menü bağlantıları */}
            <div className="space-x-6 flex">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`
                        }
                    >
                        {item.name}
                    </NavLink>
                ))}
            </div>

            {/* Sağ: Çıkış */}
            <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm font-medium transition-all"
            >
                Çıkış
            </button>
        </nav>
    );
}
