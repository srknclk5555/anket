import useSWR from "swr";
import { api } from "@/lib/api";

export function useAdmin() {
  const useSurveys = () => {
    const { data, error, isLoading, mutate } = useSWR(
      "/api/admin/surveys",
      (url: string) => api.get<{ surveys: any[] }>(url),
      { refreshInterval: 3600000 } // 1 hour polling
    );
    return { surveys: data?.surveys || [], error, isLoading, mutate };
  };

  const useResponses = (surveyId: string) => {
    const { data, error, isLoading } = useSWR(
      surveyId ? `/api/admin/surveys/${surveyId}/responses` : null,
      (url: string) => api.get<{ responses: any[] }>(url),
      { refreshInterval: 3600000 }
    );
    return { responses: data?.responses || [], error, isLoading };
  };

  const useStats = (surveyId: string) => {
    const { data, error, isLoading, mutate } = useSWR(
      surveyId ? `/api/admin/surveys/${surveyId}/stats` : null,
      (url: string) => api.get<{ stats: any }>(url),
      { refreshInterval: 3600000 }
    );
    return { stats: data?.stats, error, isLoading, mutate };
  };

  const useUsers = () => {
    const { data, error, isLoading } = useSWR(
      "/api/admin/users",
      (url: string) => api.get<{ users: any[] }>(url)
    );
    return { users: data?.users || [], error, isLoading };
  };

  const useActivityLog = () => {
    const { data, error, isLoading } = useSWR(
      "/api/admin/activity-log",
      (url: string) => api.get<{ logs: any[] }>(url)
    );
    return { logs: data?.logs || [], error, isLoading };
  };

  return { useSurveys, useResponses, useStats, useUsers, useActivityLog };
}
