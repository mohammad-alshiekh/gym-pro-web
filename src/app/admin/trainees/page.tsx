"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, Mail, Phone, Cake } from "lucide-react";
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
  const { t, locale, isRtl } = useTranslation();
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
      toast.error(t.trainees.toastFailedLoadTrainees);
    } finally {
      setLoading(false);
    }
  }, [search, page, t]);

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

        {loading && trainees.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : trainees.length === 0 ? (
          <div className="rounded-2xl border py-20 text-center" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: "#cafd00" }} />
            <p style={{ color: "#8a8888" }}>{t.common.noData}</p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#2a2a2a", background: "#131313" }}>
            <div className="overflow-x-auto">
              {/* `dir` is pinned explicitly (not just inherited from the RTL
                  page shell) so the table's own column order and each
                  cell's text-align always agree — otherwise the browser
                  flips column order for a `dir=rtl` ancestor while a
                  physical `text-left` utility class stays put, and headers
                  drift away from the data underneath them. */}
              <table dir={isRtl ? "rtl" : "ltr"} className="w-full min-w-[680px]">
                <thead>
                  <tr style={{ background: "#1a1a1a" }}>
                    {[
                      t.trainees.columnName,
                      t.trainees.columnEmail,
                      t.trainees.columnPhone,
                      t.trainees.columnBirthDate,
                      t.trainees.columnGender,
                    ].map((head) => (
                      <th
                        key={head}
                        className={`text-[10px] font-medium uppercase tracking-widest px-5 py-3.5 ${isRtl ? "text-right" : "text-left"}`}
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#8a8888" }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trainees.map((trainee) => {
                    const cell = `px-5 py-4 ${isRtl ? "text-right" : "text-left"}`;
                    return (
                      <tr
                        key={trainee.id}
                        className="border-t transition-colors hover:bg-[#1a1a1a]"
                        style={{ borderColor: "#20201f" }}
                      >
                        <td className={cell}>
                          <div className="flex items-center gap-3 min-w-0">
                            {trainee.profilePictureUrl ? (
                              <img
                                src={trainee.profilePictureUrl}
                                alt={trainee.name}
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: "rgba(202,253,0,0.1)", color: "#cafd00", fontFamily: "Lexend, sans-serif" }}
                              >
                                {getInitials(trainee.name)}
                              </div>
                            )}
                            <span className="text-sm font-medium truncate max-w-[180px]" style={{ fontFamily: "Lexend, sans-serif", color: "#ffffff" }}>
                              {trainee.name}
                            </span>
                          </div>
                        </td>
                        <td className={cell}>
                          <span className="flex items-center gap-1.5 text-sm truncate max-w-[220px]" style={{ color: "#adaaaa" }}>
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8a8888" }} />
                            {trainee.email}
                          </span>
                        </td>
                        <td className={cell}>
                          {trainee.phoneNumber ? (
                            <span className="flex items-center gap-1.5 text-sm" style={{ color: "#adaaaa" }} dir="ltr">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8a8888" }} />
                              {trainee.phoneNumber}
                            </span>
                          ) : (
                            <span className="text-sm" style={{ color: "#8a8888" }}>—</span>
                          )}
                        </td>
                        <td className={cell}>
                          <span className="flex items-center gap-1.5 text-sm" style={{ fontFamily: "JetBrains Mono, monospace", color: "#adaaaa" }}>
                            <Cake className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#8a8888" }} />
                            {formatDate(trainee.birthDate, locale)}
                          </span>
                        </td>
                        <td className={cell}>
                          <Badge variant={trainee.gender === 1 ? "info" : "neutral"}>
                            {genderLabel(trainee.gender)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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