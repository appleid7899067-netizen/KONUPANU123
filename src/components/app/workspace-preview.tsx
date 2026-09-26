import type { WorkspaceFile } from "@/store/chat";

export function WorkspacePreview({ file }: { file?: WorkspaceFile }) {
  if (!file) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm">Preview</p>
        <p className="mt-1 text-xs leading-5 text-muted">Select an HTML workspace file to preview.</p>
      </div>
    );
  }

  if (!file.path.toLowerCase().endsWith(".html")) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm">Preview unavailable</p>
        <p className="mt-1 text-xs leading-5 text-muted">Preview currently supports HTML workspace files.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-3 py-2 text-[11px] font-medium">{file.path}</div>
      <iframe
        title={file.path}
        srcDoc={file.content}
        sandbox="allow-scripts allow-forms allow-modals"
        className="h-[min(70vh,720px)] w-full bg-white"
      />
    </div>
  );
}
