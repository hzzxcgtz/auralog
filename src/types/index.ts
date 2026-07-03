export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "PENDING_REVIEW" | "GRADED";

export type TaskCategory = "SCHOOLWORK" | "PREVIEW" | "REVIEW" | "EXERCISE";

export interface DailyTaskData {
  id: number;
  date: string;
  title: string;
  category: string;
  estimatedTime: number;
  status: TaskStatus;
  spentTime: number | null;
  studentNote: string | null;
  parentComment: string | null;
  points: number | null;
  photos: TaskPhotoData[];
}

export interface TaskPhotoData {
  id: number;
  url: string;
}

export interface BookData {
  id: number;
  title: string;
  author: string | null;
  isRequired: boolean;
  totalChapters: number | null;
  totalPages: number | null;
}

export interface ReadingLogData {
  id: number;
  bookId: number;
  bookTitle?: string;
  date: string;
  progressRead: string;
  excerpts: string | null;
  thoughts: string | null;
  parentComment: string | null;
  points: number | null;
  status: "PENDING_REVIEW" | "GRADED";
}

export interface RewardData {
  id: number;
  title: string;
  cost: number;
  stock: number;
  status?: "AVAILABLE" | "REDEEMED" | "PENDING" | "APPROVED" | "REJECTED";
}

export interface SyncEvent {
  type: string;
  data: any;
  timestamp: string;
}
