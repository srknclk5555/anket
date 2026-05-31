import type { QuestionWithOptions } from "./question";

export type SurveyStatus = "draft" | "published" | "closed";

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  createdBy: string;
  publishedAt: Date | null;
  closesAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SurveyWithDetails extends Survey {
  sections: SectionWithQuestions[];
  responseCount: number;
}

export interface Section {
  id: string;
  surveyId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  createdAt: Date;
}

export interface SectionWithQuestions extends Section {
  questions: QuestionWithOptions[];
}

export type SurveyAssignmentRole = "editor" | "viewer";

export interface SurveyAssignment {
  id: string;
  surveyId: string;
  userId: string;
  role: SurveyAssignmentRole;
  canEdit: boolean;
  canView: boolean;
  canExport: boolean;
  assignedBy: string;
  assignedAt: Date;
  userName?: string;
  userEmail?: string;
}
