"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X, Loader2, ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface UploadedImage {
  url: string;
  fileName: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length + acceptedFiles.length > maxImages) {
        toast.error(`最多上传 ${maxImages} 张图片`);
        return;
      }

      setUploading(true);
      const newImages: UploadedImage[] = [];

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "image");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newImages.push({ url: data.url, fileName: data.fileName });
        } else {
          const data = await res.json();
          toast.error(data.error || `上传失败: ${file.name}`);
        }
      }

      onChange([...images, ...newImages]);
      setUploading(false);
    },
    [images, onChange, maxImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"] },
    maxSize: 5 * 1024 * 1024,
    disabled: uploading,
  });

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const dropImage = (targetIndex: number) => {
    if (draggingIndex === null || draggingIndex === targetIndex) return;
    const next = [...images];
    const [dragged] = next.splice(draggingIndex, 1);
    next.splice(targetIndex, 0, dragged);
    onChange(next);
    setDraggingIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              draggable
              onDragStart={() => setDraggingIndex(index)}
              onDragEnd={() => setDraggingIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropImage(index)}
              className={`relative group aspect-square rounded-lg overflow-hidden border bg-slate-50 ${draggingIndex === index ? "border-slate-500 opacity-60" : "border-slate-200"}`}
            >
              <Image
                src={img.url}
                alt={img.fileName}
                fill
                className="object-contain"
              />
              <div className="absolute bottom-1 right-1 hidden items-center gap-1 rounded bg-white/90 px-1.5 py-1 text-[10px] text-slate-500 shadow sm:flex">
                <GripVertical className="h-3 w-3" />拖动排序
              </div>
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button type="button" aria-label="向前移动" disabled={index === 0} onClick={() => moveImage(index, -1)} className="flex h-6 w-6 items-center justify-center rounded bg-white text-slate-700 shadow disabled:opacity-40">
                  <ArrowLeft className="h-3 w-3" />
                </button>
                <button type="button" aria-label="向后移动" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)} className="flex h-6 w-6 items-center justify-center rounded bg-white text-slate-700 shadow disabled:opacity-40">
                  <ArrowRight className="h-3 w-3" />
                </button>
                <button type="button" aria-label={`删除 ${img.fileName}`} onClick={() => removeImage(index)} className="flex h-6 w-6 items-center justify-center rounded bg-red-600 text-white shadow">
                  <X className="h-3 w-3" />
                </button>
              </div>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded font-medium">
                  主图
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-amber-500 bg-amber-50"
              : "border-slate-200 hover:border-slate-400"
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              <p className="text-sm text-slate-500 mt-2">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImagePlus className="w-8 h-8 text-slate-400" />
              <p className="text-sm text-slate-600 mt-2">
                拖拽或点击上传图片
              </p>
              <p className="text-xs text-slate-400 mt-1">
                支持 JPG/PNG/WebP，单张最大 5MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
