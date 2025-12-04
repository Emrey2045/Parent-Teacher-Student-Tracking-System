import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
    const token = localStorage.getItem("accessToken");

    //  Token kontrolü (boş, null, undefined veya "undefined" string dahil)
    const isInvalidToken =
        !token || token === "null" || token === "undefined" || token.trim() === "";

    if (isInvalidToken) {
        console.warn(" Erişim reddedildi — geçersiz veya eksik token");
        localStorage.removeItem("accessToken"); // eski kırık token’ı da temizle
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
