import { createContext, useState, useEffect } from "react";
import API from "../api/axiosInstance";
import { toast } from "react-toastify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = async (email, password) => {
        try {
            const res = await API.post("/auth/login", { email, password });
            const { accessToken, refreshToken, user } = res.data.data;
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            setUser(user);
            toast.success("Giriş başarılı!");
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || "Giriş hatası!");
            return false;
        }
    };

    const logout = async () => {
        try {
            await API.post("/auth/logout");
        } catch (e) { }
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
