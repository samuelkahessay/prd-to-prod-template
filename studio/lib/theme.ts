export const PIPELINE_STATUS_COLORS = {
  success: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    border: "border-green-300 dark:border-green-800",
  },
  in_progress: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-800",
  },
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    border: "border-yellow-300 dark:border-yellow-800",
  },
  failed: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-300 dark:border-red-800",
  },
  idle: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-800 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
  },
} as const;

export type PipelineStatus = keyof typeof PIPELINE_STATUS_COLORS;
