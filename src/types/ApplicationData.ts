// src/types/ApplicationData.ts

export interface ApplicationData {
  id: number;
  username: string;
  departmentName: string;
  applicationDate: string;
  requestedDate: string;
  reason: string;
  status: '承認' | '否認' | '申請中';
  approverUsername: string | null;
  approverDepartmentName: string | null;
  processedAt: string | null;
  isSpecialApproval: boolean | number;
  startTime: string | null;
  endTime: string | null;
}
