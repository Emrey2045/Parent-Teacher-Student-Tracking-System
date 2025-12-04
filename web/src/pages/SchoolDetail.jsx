import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plus, X, GraduationCap } from "lucide-react";

export default function SchoolDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    const [school, setSchool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", grade: "", section: "" });
    const [successMsg, setSuccessMsg] = useState("");

    // 🔹 Okul detaylarını çek
    const fetchSchool = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/schools/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSchool(res.data.data);
        } catch (err) {
            console.error("Okul detayları alınamadı:", err);
            setError("Okul bilgileri alınamadı ❌");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Yeni öğrenci ekle
    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!newStudent.name.trim() || !newStudent.grade.trim()) return;

        try {
            await axios.post(
                `http://localhost:5000/schools/${id}/students`,
                newStudent,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowModal(false);
            setNewStudent({ name: "", grade: "", section: "" });
            setSuccessMsg("✅ Öğrenci başarıyla eklendi!");
            fetchSchool();
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            console.error("Öğrenci eklenirken hata:", err);
            setError("❌ Öğrenci eklenemedi, tekrar deneyin.");
        }
    };

    useEffect(() => {
        fetchSchool();
    }, [id]);

    if (loading)
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Yükleniyor...</div>;
    if (error)
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* 🔙 Geri Butonu */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
            >
                <ArrowLeft size={18} className="mr-1" /> Geri Dön
            </button>

            {/* 🏫 Okul Başlığı */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-indigo-700 mb-1">{school.name}</h1>
                    <p className="text-gray-600">Okul bilgileri ve öğrenciler</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
                >
                    <Plus size={18} /> Öğrenci Ekle
                </button>
            </div>

            {/* ✅ Başarı Mesajı */}
            {successMsg && (
                <div className="bg-green-100 border border-green-300 text-green-700 p-3 rounded-lg mb-6 text-center">
                    {successMsg}
                </div>
            )}

            {/* 🏫 Okul Bilgileri */}
            <div className="bg-white p-6 rounded-2xl shadow mb-8">
                <p className="text-gray-700 mb-2">
                    <strong>Yönetici:</strong> {school.manager?.name || "Atanmamış"}
                </p>
                <p className="text-gray-700 mb-2">
                    <strong>Öğretmen Sayısı:</strong> {school.teachers?.length || 0}
                </p>
                <p className="text-gray-700">
                    <strong>Öğrenci Sayısı:</strong> {school.students?.length || 0}
                </p>
            </div>

            {/* 🎓 Öğrenciler */}
            <div className="bg-white p-6 rounded-2xl shadow">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
                    <GraduationCap size={20} /> Öğrenciler
                </h2>

                {school.students?.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {school.students.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => navigate(`/students/${student.id}`)}
                                className="p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 hover:shadow-md cursor-pointer transition"
                            >
                                <p className="font-semibold text-indigo-700">{student.name}</p>
                                <p className="text-gray-600 text-sm">
                                    {student.grade} / {student.section || "-"}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center">Henüz öğrenci eklenmemiş.</p>
                )}
            </div>

            {/* 🧩 Öğrenci Ekle Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-indigo-700 mb-4">
                            🎓 Yeni Öğrenci Ekle
                        </h2>

                        <form onSubmit={handleAddStudent}>
                            <input
                                type="text"
                                placeholder="Öğrenci Adı"
                                value={newStudent.name}
                                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Sınıf"
                                value={newStudent.grade}
                                onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Şube"
                                value={newStudent.section}
                                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-indigo-400 outline-none"
                            />

                            <div className="flex justify-end mt-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
