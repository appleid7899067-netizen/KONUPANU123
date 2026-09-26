import type { ComponentProps } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function Sheet({ ...props }: ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

function SheetTrigger(props: ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />;
}

function SheetClose(props: ComponentProps<typeof Dialog.Close>) {
  return <Dialog.Close {...props} />;
}

function SheetContent({
  className,
  children,
  side = "left",
  title,
  ...props
}: ComponentProps<typeof Dialog.Content> & {
  side?: "left" | "right" | "bottom";
  title: string;
}) {
  const sideClass =
    side === "bottom"
      ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl data-[state=open]:animate-[sheet-up_250ms_var(--ease-out-smooth)]"
      : side === "right"
        ? "inset-y-0 right-0 h-full w-[min(100%,20rem)] rounded-l-lg data-[state=open]:animate-[sheet-right_250ms_var(--ease-out-smooth)]"
        : "inset-y-0 left-0 h-full w-[min(100%,20rem)] rounded-r-lg data-[state=open]:animate-[sheet-left_250ms_var(--ease-out-smooth)]";

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-[fade-in_200ms_ease-out]" />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex flex-col bg-surface shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_10%,transparent)] outline-none",
          sideClass,
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Dialog.Title className="text-sm font-medium text-fg">{title}</Dialog.Title>
          <Dialog.Close className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-fg">
            <X className="size-4" />
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent };
