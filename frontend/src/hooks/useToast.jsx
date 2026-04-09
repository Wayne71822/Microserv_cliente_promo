import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };
  return { toast, showToast };
}
