import { useCallback, useEffect, useRef, useState } from 'react';
import { AppIcon } from './icons';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png';

export type LocalListingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function readFiles(fileList: FileList | null, maxCount: number, current: number): File[] {
  if (!fileList?.length) return [];
  const next: File[] = [];
  for (let i = 0; i < fileList.length && current + next.length < maxCount; i++) {
    const f = fileList[i];
    if (!f.type.match(/^image\/(jpeg|png)$/)) continue;
    if (f.size > MAX_FILE_BYTES) continue;
    next.push(f);
  }
  return next;
}

export function ListingImageUploader({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}: {
  images: LocalListingImage[];
  onChange: (images: LocalListingImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const addFiles = useCallback(
    (files: File[]) => {
      if (!files.length) {
        setHint('Chỉ chấp nhận JPEG/PNG, tối đa 5MB mỗi ảnh.');
        return;
      }
      const slots = maxImages - images.length;
      if (slots <= 0) {
        setHint(`Tối đa ${maxImages} ảnh.`);
        return;
      }
      const batch = files.slice(0, slots).map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      onChange([...images, ...batch]);
      setHint(null);
    },
    [images, maxImages, onChange],
  );

  const remove = (id: string) => {
    const target = images.find((x) => x.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(images.filter((x) => x.id !== id));
  };

  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((x) => URL.revokeObjectURL(x.previewUrl));
    };
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    addFiles(readFiles(e.dataTransfer.files, maxImages, images.length));
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-brand-500 bg-brand-100/80'
            : 'border-brand-200 bg-brand-50/50 hover:border-brand-400 hover:bg-brand-50'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <div className="mb-2 flex justify-center">
          <AppIcon name="layers" size="xl" alt="" />
        </div>
        <p className="text-sm font-medium text-ink">
          Kéo thả ảnh vào đây hoặc bấm để chọn từ máy
        </p>
        <p className="text-xs text-muted mt-1">
          JPEG/PNG · tối đa 5MB/ảnh · {images.length}/{maxImages} ảnh
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            addFiles(readFiles(e.target.files, maxImages, images.length));
            e.target.value = '';
          }}
        />
      </div>

      {hint && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {hint}
        </p>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.previewUrl}
                alt=""
                className="h-20 w-28 rounded-lg object-cover shadow-sm border border-brand-100"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(img.id);
                  }}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs shadow-md opacity-90 hover:opacity-100"
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
