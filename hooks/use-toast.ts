import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive" | "success";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const toast = ({
    title,
    description,
    variant = "default",
    action,
  }: ToastOptions) => {
    const message = title || description || "";
    const desc = title && description ? description : undefined;

    const toastOptions = {
      description: desc,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    };

    switch (variant) {
      case "destructive":
        return sonnerToast.error(message, toastOptions);
      case "success":
        return sonnerToast.success(message, toastOptions);
      default:
        return sonnerToast(message, toastOptions);
    }
  };

  return { toast };
}
