import { ImageIcon, Link2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { fileToProductImage } from "@/lib/product-image";

type ImageMode = "url" | "upload";

export function ProductImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (image: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImageMode>("url");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const dataUrl = await fileToProductImage(file);
      onChange(dataUrl);
      setMode("upload");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "url"
              ? "bg-burgundy text-white"
              : "border border-border text-muted-foreground hover:text-burgundy"
          }`}
        >
          <Link2 className="size-3.5" />
          Online URL
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "upload"
              ? "bg-burgundy text-white"
              : "border border-border text-muted-foreground hover:text-burgundy"
          }`}
        >
          <Upload className="size-3.5" />
          Local upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {mode === "url" ? (
        <input
          placeholder="https://images.unsplash.com/..."
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-blush-section/40 p-4 text-center">
          <ImageIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            {uploading ? "Processing image…" : "Choose a photo from your device"}
          </p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="mt-3 rounded-lg border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-burgundy hover:bg-blush-section disabled:opacity-60"
          >
            Browse files
          </button>
        </div>
      )}

      {uploadError && (
        <p className="text-sm text-red-600">{uploadError}</p>
      )}

      {value && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-blush-section/30 p-3">
          <img
            src={value}
            alt="Product preview"
            className="size-16 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Preview</p>
            <p className="mt-1 truncate">
              {value.startsWith("data:") ? "Local image (stored in browser)" : value}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
