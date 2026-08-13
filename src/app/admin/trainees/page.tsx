"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataTable from "@/components/ui/DataTable";
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
  const { t } = useTranslation();
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
    if (g === 1) return "Male";
    if (g === 2) return "Female";
    return "—";
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (_: unknown, row: Trainee) => (
        <div className="flex items-center gap-3">
          {row.profilePictureUrl ? (
            <img src={row.profilePictureUrl} alt={row.name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "#23272e", color: "#c8f323" }}>
              {getInitials(row.name)}
            </div>
          )}
          <span style={{ fontFamily: "Lexend, sans-serif" }}>{row.name}</span>
        </div>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "phoneNumber",
      label: "Phone",
      render: (v: unknown) => String(v ?? "—"),
    },
    {
      key: "gender",
      label: "Gender",
      render: (v: unknown) => (
        <Badge variant={v === 1 ? "info" : "neutral"}>
          {genderLabel(v as number)}
        </Badge>
      ),
    },
    {
      key: "birthDate",
      label: "Birth Date",
      render: (v: unknown) => formatDate(v as string),
    },
  ];

  return (
    <DashboardLayout title={t.trainees.title} requiredRole="super_admin">
      <div className="space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8b93a1" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search trainees..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm input-accent"
            style={{ background: "#0f1013", borderColor: "#2f3742", color: "#e9ecf1", outline: "none" }}
          />
        </div>

        {loading && trainees.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl shimmer" />
            ))}
          </div>
        ) : trainees.length === 0 ? (
          <div className="text-center py-20" style={{ color: "#8b93a1" }}>
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t.common.noData}</p>
          </div>
        ) : (
          <DataTable
            columns={columns as Parameters<typeof DataTable>[0]["columns"]}
            data={trainees as unknown as Record<string, unknown>[]}
            keyExtractor={(row) => String(row.id)}
            loading={loading}
          />
        )}

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
