"use client";

import { useState, useRef } from "react";

interface PhotoUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  existingPhotos?: string[];
  maxCount?: number;
}

export default function PhotoUploader({
  onUploadComplete,
  existingPhotos = [],
  maxCount = 6,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setError(null);
    const remaining = maxCount - photos.length;
    if (files.length > remaining) {
      setError(`最多上传 ${remaining} 张图片`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} 不是图片格式`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} 超过 10MB`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url);
        } else {
          const err = await res.json();
          setError(err.error || "上传失败");
        }
      } catch {
        setError("网络错误，请重试");
      }
    }

    setUploading(false);
    const allPhotos = [...photos, ...uploadedUrls];
    setPhotos(allPhotos);
    onUploadComplete(allPhotos);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onUploadComplete(newPhotos);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {photos.map((url, i) => (
          <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border-warm group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`照片 ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < maxCount && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-border-warm flex items-center justify-center hover:border-caramel/50 transition-colors text-text-light hover:text-caramel"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-caramel/30 border-t-caramel rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <p className="text-[10px] text-text-light mt-0.5">支持 JPG/PNG/WebP，单张不超过 10MB</p>
    </div>
  );
}

// 照片查看器
export function PhotoViewer({ urls, onClose }: { urls: string[]; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (urls.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[currentIndex]}
          alt={`照片 ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        <div className="flex justify-center items-center space-x-4 mt-3">
          {urls.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(i => (i - 1 + urls.length) % urls.length)}
                className="text-white bg-white/20 px-3 py-1 rounded text-xs hover:bg-white/30"
              >
                上一张
              </button>
              <span className="text-white/70 text-xs">{currentIndex + 1} / {urls.length}</span>
              <button
                onClick={() => setCurrentIndex(i => (i + 1) % urls.length)}
                className="text-white bg-white/20 px-3 py-1 rounded text-xs hover:bg-white/30"
              >
                下一张
              </button>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black/40 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
