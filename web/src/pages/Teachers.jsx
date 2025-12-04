import { useEffect, useState } from "react";
import axios from "axios";

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newTeacher, setNewTeacher] = useState({ name: "", subject: "" });

    const token = localStorage.getItem("accessToken");

    // 🔹 Öğretmenleri getir
    const fetchTeachers = async () => {
        try {
            const res = await axios.get("http://localhost:5000/teachers", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTeachers(res.data.data || []);
        } catch (err) {
            console.error("Öğretmenler yüklenirken hata:", err);
            setError("Öğretmenler yüklenemedi ❌");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Yeni öğretmen ekle
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTeacher.name || !newTeacher.subject) return;

        try {
            // 🏫 Manager'ın okul ID'sini al (zorunlu alan)
            const schoolRes = await axios.get("http://localhost:5000/schools", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const schoolId = schoolRes.data.data?.[0]?.id;
            if (!schoolId) {
                alert("Okul ID bulunamadı. Lütfen önce okul oluşturun.");
                return;
            }

            // 👨‍🏫 Öğretmeni backend'e gönder
            await axios.post(
                "http://localhost:5000/teachers",
                { ...newTeacher, schoolId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNewTeacher({ name: "", subject: "" });
            fetchTeachers();
        } catch (err) {
            console.error("Ekleme hatası:", err.response?.data || err);
            alert("Ekleme hatası: " + (err.response?.data?.message || "Bilinmeyen hata"));
        }
    };

    // 🔹 Öğretmen sil
    const handleDelete = async (id) => {
        if (!window.confirm("Bu öğretmeni silmek istiyor musun?")) return;
        try {
            await axios.delete(`http://localhost:5000/teachers/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchTeachers();
        } catch (err) {
            console.error("Silme hatası:", err);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    // 🔹 Yükleniyor ekranı
    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Yükleniyor...
            </div>
        );

    // 🔹 Hata ekranı
    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                {error}
            </div>
        );

    // 🔹 Sayfa içeriği
    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">👨‍🏫 Öğretmenler</h1>

            {/* Yeni Öğretmen Ekleme Formu */}
            <form
                onSubmit={handleAdd}
                className="max-w-lg mx-auto bg-white shadow-md rounded-xl p-6 mb-8"
            >
                <div className="grid md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="İsim"
                        value={newTeacher.name}
                        onChange={(e) =>
                            setNewTeacher({ ...newTeacher, name: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Branş"
                        value={newTeacher.subject}
                        onChange={(e) =>
                            setNewTeacher({ ...newTeacher, subject: e.target.value })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                </div>
                <button
                    type="submit"
                    className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-all"
                >
                    Ekle
                </button>
            </form>

            {/* Öğretmen Listesi */}
            {teachers.length === 0 ? (
                <p className="text-center text-gray-600">Henüz öğretmen yok</p>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teachers.map((teacher) => (
                        <div
                            key={teacher.id}
                            className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition relative"
                        >
                            <h2 className="text-xl font-semibold text-indigo-700 mb-2">
                                {teacher.name}
                            </h2>
                            <p className="text-gray-600">
                                <strong>Branş:</strong> {teacher.subject}
                            </p>
                            <button
                                onClick={() => handleDelete(teacher.id)}
                                className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                ✖
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
