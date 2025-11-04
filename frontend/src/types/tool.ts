// types/tool.ts
export type Tool = {
  id: number;
  certificateNumber: string;
  gasName: string;
  gasUnit: string;
  vendorName: string;
  concentration: number;
  uncertaintyPercent: number;
  uncertaintyStandard?: number;
  dueDate: string;
  certFile?: string;         // URL path to cert file (for display)
  toolImage?: string;        // URL path to tool image (for display)
  createdAt?: string;
  updatedAt?: string;
};

// ✅ NEW: Type for creating/updating tools (with file upload URLs)
export type ToolFormData = {
  id?: number;
  certificateNumber: string;
  gasName: string;
  gasUnit: string;
  vendorName: string;
  concentration: number;
  uncertaintyPercent: number;
  uncertaintyStandard?: number;
  dueDate: string;
  certFileUrl?: string;      // URL from file upload
  toolImageUrl?: string;     // URL from file upload
};

// ✅ ALTERNATIVE: Extend the main Tool type to accept both formats
export type ToolInput = Tool & {
  certFileUrl?: string;      // For form input
  toolImageUrl?: string;     // For form input
};