"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { FileUp, X, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  type: "document" | "certificate";
  maxFiles?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  files,
  onChange,
  type,
  maxFiles = 20,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`最多上传 ${maxFiles} 个文件`);
        return;
      }

      setUploading(true);
      const newFiles: UploadedFile[] = [];

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newFiles.push(data);
        } else {
          const data = await res.json();
          toast.error(data.error || `上传失败: ${file.name}`);
        }
      }

      onChange([...files, ...newFiles]);
      setUploading(false);
    },
    [files, onChange, type, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {files.length < maxFiles && (
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
              <FileUp className="w-8 h-8 text-slate-400" />
              <p className="text-sm text-slate-600 mt-2">
                拖拽或点击上传{type === "certificate" ? "证书" : "文档"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                支持 PDF/JPG/PNG，最大 20MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
