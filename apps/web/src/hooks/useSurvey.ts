import useSWR from "swr";
import { api } from "@/lib/api";
import type { SurveyWithDetails } from "@gorunmeyen-lig/shared";

export function useSurvey(surveyId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    surveyId ? `/api/surveys/${surveyId}` : null,
    (url: string) => api.get<{ survey: SurveyWithDetails }>(url),
    { revalidateOnFocus: false }
  );

  return {
    survey: data?.survey,
    error,
    isLoading,
    mutate,
  };
}

export function usePublishedSurveys() {
  const { data, error, isLoading } = useSWR(
    "/api/surveys",
    (url: string) => api.get<{ surveys: any[] }>(url),
    { revalidateOnFocus: false }
  );

  return {
    surveys: data?.surveys || [],
    error,
    isLoading,
  };
}
