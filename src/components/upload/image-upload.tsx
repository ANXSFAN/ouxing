"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-3">
      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-slate-50">
              <Image
                src={img.url}
                alt={img.fileName}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
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
