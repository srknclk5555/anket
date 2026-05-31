export interface Response {
  id: string;
  surveyId: string;
  userId: string;
  submittedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AnswerValue {
  id: string;
  responseId: string;
  questionId: string;
  optionId: string | null;
  textValue: string | null;
  numberValue: number | null;
  rankValue: number | null;
  isOtherText: boolean;
}

export interface ResponseWithAnswers extends Response {
  answers: AnswerValue[];
}

export interface SubmitResponsePayload {
  turnstileToken: string;
  answers: SubmitAnswerPayload[];
}

export interface SubmitAnswerPayload {
  questionId: string;
  optionId?: string;
  textValue?: string;
  numberValue?: number;
  rankValue?: number;
  isOtherText?: boolean;
}

export interface ResponseStats {
  totalResponses: number;
  questionStats: QuestionStat[];
}

export interface QuestionStat {
  questionId: string;
  questionTitle: string;
  questionType: string;
  responseCount: number;
  optionCounts?: { optionId: string; label: string; count: number }[];
  averageValue?: number;
  textPreview?: string[];
}
