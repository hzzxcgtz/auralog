export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "PENDING_REVIEW" | "GRADED";
export type TaskAction = "START" | "STOP" | "SUBMIT" | "GRADE";

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE"],
  DONE: ["PENDING_REVIEW", "GRADED"],
  PENDING_REVIEW: ["GRADED"],
  GRADED: ["GRADED"],
};

const ACTION_TO_STATUS: Record<TaskAction, TaskStatus> = {
  START: "IN_PROGRESS",
  STOP: "DONE",
  SUBMIT: "PENDING_REVIEW",
  GRADE: "GRADED",
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getTargetStatus(action: TaskAction): TaskStatus {
  return ACTION_TO_STATUS[action];
}

export function validateTransition(
  currentStatus: TaskStatus,
  action: TaskAction,
  extra?: { spentTime?: number; studentNote?: string; points?: number }
): { valid: boolean; error?: string } {
  const target = getTargetStatus(action);

  if (!canTransition(currentStatus, target)) {
    return {
      valid: false,
      error: `不允许从 ${currentStatus} 转换到 ${target}`,
    };
  }

  if (action === "STOP" && !extra?.spentTime) {
    return { valid: false, error: "停止计时需要提供实际耗时" };
  }

  if (action === "SUBMIT" && !extra?.studentNote) {
    return { valid: false, error: "提交审核需要填写心得" };
  }

  if (action === "GRADE" && !extra?.points) {
    return { valid: false, error: "评价需要给出积分" };
  }

  return { valid: true };
}

export function buildUpdateData(
  action: TaskAction,
  extra?: { spentTime?: number; studentNote?: string; parentComment?: string; points?: number; photos?: number[] }
): Record<string, any> {
  const data: Record<string, any> = {
    status: getTargetStatus(action),
  };

  if (action === "STOP" && extra?.spentTime !== undefined) {
    data.spentTime = extra.spentTime;
  }
  if (action === "SUBMIT") {
    if (extra?.studentNote !== undefined) data.studentNote = extra.studentNote;
    if (extra?.photos !== undefined) data.photos = extra.photos;
  }
  if (action === "GRADE") {
    if (extra?.parentComment !== undefined) data.parentComment = extra.parentComment;
    if (extra?.points !== undefined) data.points = extra.points;
  }

  return data;
}
