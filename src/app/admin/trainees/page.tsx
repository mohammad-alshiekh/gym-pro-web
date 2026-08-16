"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search } from "lucide-react";
import Link from "next/link"; // استيراد Link للتنقل
import DashboardLayout from "@/components/layout/DashboardLayout";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/hooks/useTranslation";
import { traineesApi } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

interface Trainee {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  gender: number;
  birthDate?: string;
  profilePictureUrl?: string;
}

export default function AdminTraineesPage() {
  const { t, locale } = useTranslation();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const perPage = 10;

  const fetchTrainees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await traineesApi.getAll({
        "pageInfo.PageNumber": page,
        "pageInfo.ResultsPerPage": perPage,
        searchQuery: search || undefined,
      });
      setTrainees(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error("Failed to load trainees");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  const genderLabel = (g: number) => {
    if (g === 0) return t.common.male;
    if (g === 1) return t.common.female;
    return "—";
  };

  // تم حذف الكود الخاص بـ columns لأننا لم نعد بحاجة للجدول

  return (
    <DashboardLayout title={t.trainees.title} requiredRole="super_admin">
      <div className="space-y-6">
        {/* شريط البحث */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8a8888" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t.trainees.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
            style={{ background: "#0e0e0e", borderColor: "#2a2a2a", color: "#ffffff", outline: "none" }}
          />
        </div>

        {/* حالة التحميل (Shimmer Cards) */}
        {loading && trainees.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl shimmer" style={{ background: "#1a1a1a" }} />
            ))}
          </div>
        ) : trainees.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8a8888" }}>
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t.common.noData}</p>
          </div>
        ) : (
          /* شبكة البطاقات */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainees.map((trainee) => (
              <div
                key={trainee.id}
             //   href={`/admin/trainees/${trainee.id}`}
                className="block transition-all duration-200 hover:scale-[1.01] hover:border-[#cafd00]"
              >
                <div
                  className="p-5 rounded-xl border flex flex-col h-full gap-3"
                  style={{
                    background: "#0e0e0e",
                    borderColor: "#2a2a2a",
                  }}
                >
                  {/* رأس البطاقة: الصورة والاسم */}
                  <div className="flex items-center gap-3">
                    {trainee.profilePictureUrl ? (
                      <img
                        src={trainee.profilePictureUrl}
                        alt={trainee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "#20201f", color: "#cafd00" }}
                      >
                        {getInitials(trainee.name)}
                      </div>
                    )}
                    <span className="font-semibold text-white" style={{ fontFamily: "Lexend, sans-serif" }}>
                      {trainee.name}
                    </span>
                  </div>

                  {/* تفاصيل المتدرب */}
                  <div className="flex-1 space-y-1.5 text-sm" style={{ color: "#a0a0a0" }}>
                    <p>📧 {trainee.email}</p>
                    <p>📞 {trainee.phoneNumber ?? "—"}</p>
                    <p>🎂 {formatDate(trainee.birthDate)}</p>
                  </div>

                  {/* تذييل البطاقة (النوع) */}
                  <div className="mt-auto pt-2 border-t" style={{ borderColor: "#1f1f1f" }}>
                    <Badge variant={trainee.gender === 1 ? "info" : "neutral"}>
                      {genderLabel(trainee.gender)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* الترقيم (Pagination) */}
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalCount / perPage) || 1}
          onPageChange={setPage}
          totalCount={totalCount}
          resultsPerPage={perPage}
        />
      </div>
    </DashboardLayout>
  );
}