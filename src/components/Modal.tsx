"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";

export function Modal({
  open, onOpenChange, title, children, footer
}: { open: boolean; onOpenChange: (v: boolean) => void; title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/55 z-40 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl z-50 paper-card flex flex-col max-h-[90vh] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
          style={{ borderRadius: 0 }}
        >
          <div className="relative z-[1] flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-rule">
            <Dialog.Title asChild>
              <h2 className="font-display text-[1.6rem] leading-[1.1] tracking-tightish min-w-0 break-words">
                {title}
              </h2>
            </Dialog.Title>
            <Dialog.Close type="button" className="btn-ghost shrink-0" aria-label="Close">
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="relative z-[1] px-6 py-5 overflow-y-auto flex-1">{children}</div>
          {footer && (
            <div className="relative z-[1] px-6 py-3 border-t border-rule flex flex-wrap items-center justify-between gap-3 bg-cream/40">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
