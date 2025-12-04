import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, BookOpen, BarChart3 } from "lucide-react";

export default function StudentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    //  Tekil öğrenci bilgilerini getir
    const fetchStudent = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/students/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStudent(res.data.data);
        } catch (err) {
            console.error("Öğrenci bilgileri alınamadı:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudent();
    }, [id]);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Yükleniyor...
            </div>
        );

    if (!student)
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                Öğrenci bilgileri alınamadı 
            </div>
        );

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/*  Geri Dön */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
            >
                <ArrowLeft size={18} /> Geri Dön
            </button>

            {/*  Başlık */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-indigo-700">
                        {student.name}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {student.grade} / {student.section || "-"}
                    </p>
                </div>
            </div>

            {/*  Öğrenci Bilgileri */}
            <div className="bg-white p-6 rounded-2xl shadow mb-6">
                <p>
                    <strong>Okul:</strong>{" "}
                    {student.school?.name || "Atanmamış"}
                </p>
                <p>
                    <strong>Veli:</strong>{" "}
                    {student.parent?.name || "Atanmamış"}
                </p>
                <p>
                    <strong>Kayıt Tarihi:</strong>{" "}
                    {new Date(student.createdAt).toLocaleDateString("tr-TR")}
                </p>
            </div>

            {/*  Akademik Veriler (ileride buraya raporlar gelecek) */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow flex flex-col justify-center items-center text-center">
                    <BarChart3 size={32} className="text-indigo-600 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700">
                        Akademik Raporlar
                    </h3>
                    <p className="text-gray-500 text-sm mt-2">
                        Doğru / yanlış / boş soru istatistikleri burada
                        görüntülenecek.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow flex flex-col justify-center items-center text-center">
                    <BookOpen size={32} className="text-indigo-600 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700">
                        Kitap ve Soru Geçmişi
                    </h3>
                    <p className="text-gray-500 text-sm mt-2">
                        Öğrencinin çözdüğü kitaplar ve toplam soru sayısı
                        burada yer alacak.
                    </p>
                </div>
            </div>
        </div>
    );
}
