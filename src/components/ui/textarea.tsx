import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-11 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-sm text-fg outline-none placeholder:text-subtle disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
