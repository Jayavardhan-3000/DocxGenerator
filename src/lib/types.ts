export interface ScriptAnalysis {
  usesDocx: boolean;
  hasPacker: boolean;
  outputFile: string | null;
  outputDir: string | null;
  claudePath: string | null;
  headings: number;
  tables: number;
  images: number;
  codeBlocks: number;
  paragraphs: number;
  estimatedPages: number;
  isValid: boolean;
  errors: string[];
}

export interface UploadResponse {
  success: boolean;
  jobId: string;
  filename: string;
  docxSize: number;
  pdfAvailable: boolean;
  pdfSize: number | null;
  pdfError: string | null;
  logs: string[];
  durationMs: number;
  analysis: ScriptAnalysis;
  error?: string;
}

export type ProcessingStep =
  | "upload"
  | "analyze"
  | "patch"
  | "execute"
  | "docx"
  | "pdf";

export type StepStatus = "pending" | "running" | "done" | "error";

export interface StepState {
  id: ProcessingStep;
  label: string;
  status: StepStatus;
}

export interface RecentFile {
  jobId: string;
  filename: string;
  docxSize: number;
  pdfAvailable: boolean;
  generatedAt: string;
  customName?: string;
}
