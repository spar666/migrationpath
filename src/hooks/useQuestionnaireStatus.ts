import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";

export interface QuestionnaireData {
  id: string;
  user_id: string;
  submitted_at: string;
  answers: Record<string, unknown>;
  [key: string]: unknown;
}

interface UseQuestionnaireStatusReturn {
  hasCompletedQuestionnaire: boolean;
  questionnaireData: QuestionnaireData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuestionnaireStatus(userId: string | null): UseQuestionnaireStatusReturn {
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestionnaireStatus = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await apiClient.get<QuestionnaireData | null>('/consultation/questionnaire/status');

      if (data) {
        setHasCompletedQuestionnaire(true);
        setQuestionnaireData(data);
      } else {
        setHasCompletedQuestionnaire(false);
        setQuestionnaireData(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Failed to check questionnaire status");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchQuestionnaireStatus();
  }, [fetchQuestionnaireStatus]);

  return {
    hasCompletedQuestionnaire,
    questionnaireData,
    isLoading,
    error,
    refetch: fetchQuestionnaireStatus,
  };
}
