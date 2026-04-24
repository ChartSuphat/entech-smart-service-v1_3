// types/tool.ts
export type MixGasComponent = {
  id?: number;
  gasName: string;
  gasUnit: string;
  concentration: number;
  uncertaintyPercent: number;
  uncertaintyStandard?: number;
};

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
  isBlocked?: boolean;
  isMixGas?: boolean;
  components?: MixGasComponent[];
  certFile?: string;
  toolImage?: string;
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