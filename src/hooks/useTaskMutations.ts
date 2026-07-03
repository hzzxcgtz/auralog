"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useTaskMutations() {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({
      taskId,
      action,
      data,
    }: {
      taskId: number;
      action: string;
      data?: Record<string, any>;
    }) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "操作失败");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return { updateStatus };
}
