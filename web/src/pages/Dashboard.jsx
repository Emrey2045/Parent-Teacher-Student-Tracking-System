import { useEffect, useState } from "react";
import axios from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    LineChart,
    Line,
} from "recharts";
import { Link } from "react-router-dom";
import {
    Users,
    GraduationCap,
    School,
    UserSquare2,
    Bell,
    TrendingUp,
} from "lucide-react";

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // 📊 Verileri çek
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setRole(payload.role);

            const endpoint =
                payload.role === "admin"
                    ? "http://localhost:5000/dashboard/overview"
                    : payload.role === "manager"
                        ? "http://localhost:5000/dashboard/school-stats"
                        : null;

            if (!endpoint) {
                setLoading(false);
                return;
            }

            axios
                .get(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    setStats(res.data.data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Dashboard yüklenirken hata:", err);
                    setLoading(false);
                });
        } catch (e) {
            console.error("Token çözümleme hatası:", e);
            setLoading(false);
        }
    }, []);

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-600">
                Yükleniyor...
            </div>
        );

    if (!stats)
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                Veri alınamadı �
            </div>
        );

    // ===  Stat kartları ===
    const cards =
        role === "admin"
            ? [
                { title: "Okul", value: stats.totalSchools, icon: School },
                { title: "Öğretmen", value: stats.totalTeachers, icon: Users },
                { title: "Öğrenci", value: stats.totalStudents, icon: GraduationCap },
                { title: "Veli", value: stats.totalParents, icon: UserSquare2 },
            ]
            : [
                { title: "Öğretmen", value: stats.teachers, icon: Users },
                { title: "Öğrenci", value: stats.students, icon: GraduationCap },
                { title: "Veli", value: stats.parents, icon: UserSquare2 },
            ];

    // === Örnek veri: son 7 gün öğrenci aktivitesi ===
    const mockStudentActivity = [
        { day: "Pzt", solved: 120 },
        { day: "Sal", solved: 180 },
        { day: "Çar", solved: 220 },
        { day: "Per", solved: 260 },
        { day: "Cum", solved: 300 },
        { day: "Cmt", solved: 180 },
        { day: "Paz", solved: 100 },
    ];

    // ===  Örnek veri: son işlemler ===
    const mockActivityFeed = [
        { id: 1, text: "Yeni öğrenci eklendi: **Ece Yılmaz**", time: "2 dk önce" },
        { id: 2, text: "Yeni öğretmen oluşturuldu: **Ahmet Kaya (Matematik)**", time: "10 dk önce" },
        { id: 3, text: "**MBA Ankara** okulundan 3 öğrenci kayıt oldu.", time: "1 saat önce" },
        { id: 4, text: "Sistem yedeği başarıyla alındı.", time: "3 saat önce" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Başlık */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                        {role === "admin" ? "📊 Yönetim Paneli" : "🏫 Okul Yönetim Paneli"}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Sistem durumunu, aktivite akışını ve performans verilerini takip et.
                    </p>
                </div>

                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition">
                    <Bell size={18} />
                    Bildirimler
                </button>
            </div>

            {/* Üst Kartlar */}
            <div
                className={`grid gap-6 mb-10 w-full ${role === "admin"
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    }`}
            >
                {cards.map((card) => (
                    <StatCard key={card.title} {...card} />
                ))}
            </div>

            {/* Grafikler */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Genel Dağılım */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" />
                        {role === "admin" ? "Genel Dağılım" : `${stats.school} Dağılımı`}
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={cards.map(c => ({ name: c.title, value: c.value }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Öğrenci Aktivitesi */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                         Haftalık Öğrenci Aktivitesi
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={mockStudentActivity}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="solved" stroke="#6366F1" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Alt Alan: Aktivite Akışı + Hızlı Erişim */}
            <div className="mt-10 grid lg:grid-cols-3 gap-6">
                {/* Aktivite akışı */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                         Son İşlemler
                    </h2>
                    <ul className="space-y-3">
                        {mockActivityFeed.map((item) => (
                            <li
                                key={item.id}
                                className="border-b border-gray-100 pb-2 text-sm text-gray-700"
                            >
                                <span
                                    dangerouslySetInnerHTML={{ __html: item.text }}
                                ></span>
                                <div className="text-xs text-gray-400">{item.time}</div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Hızlı erişimler */}
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-4">
                         Hızlı Erişim
                    </h3>
                    <QuickAccess
                        title=" Öğretmen Yönetimi"
                        description="Yeni öğretmen ekle, bilgilerini düzenle veya kaldır."
                        link="/teachers"
                    />
                    <QuickAccess
                        title=" Öğrenci Raporları"
                        description="Öğrencilerin soru çözümleri ve başarı istatistikleri."
                        link="/students"
                    />
                    <QuickAccess
                        title=" Okul Listesi"
                        description="Okul detaylarını görüntüle veya düzenle."
                        link="/schools"
                    />
                </div>
            </div>
        </div>
    );
}

// ===  Stat Card ===
function StatCard({ title, value, icon: Icon }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 flex items-center gap-4">
            <div className="bg-indigo-100 text-indigo-700 p-3 rounded-full">
                <Icon size={22} />
            </div>
            <div>
                <h2 className="text-sm text-gray-500">{title}</h2>
                <p className="text-3xl font-bold text-indigo-600">{value}</p>
            </div>
        </div>
    );
}

// ===  Quick Access ===
function QuickAccess({ title, description, link }) {
    return (
        <Link
            to={link}
            className="block mb-3 bg-white border border-gray-200 rounded-xl p-4 hover:bg-indigo-50 transition"
        >
            <h4 className="text-sm font-semibold text-indigo-700">{title}</h4>
            <p className="text-xs text-gray-600">{description}</p>
        </Link>
    );
}
