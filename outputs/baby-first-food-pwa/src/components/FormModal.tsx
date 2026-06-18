import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

const MAX_IMAGE_LENGTH = 50000;

export type FieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'date' | 'url' | 'textarea' | 'select' | 'image';
  options?: string[];
  placeholder?: string;
};

async function resizeImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = dataUrl;
  });

  const formats = ['image/webp', 'image/jpeg'];
  const longestEdge = Math.max(image.width, image.height);
  const initialEdge = Math.min(640, longestEdge);

  for (let formatIndex = 0; formatIndex < formats.length; formatIndex += 1) {
    const format = formats[formatIndex];
    let maxSize = initialEdge;

    while (maxSize >= 64) {
      let quality = 0.82;

      while (quality >= 0.12) {
        const scale = Math.min(1, maxSize / longestEdge);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return dataUrl;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL(format, quality);
        if (compressed.length <= MAX_IMAGE_LENGTH) {
          return compressed;
        }
        quality -= 0.08;
      }

      maxSize = Math.floor(maxSize * 0.8);
    }
  }

  throw new Error('Gambar terlalu besar. Cuba gambar lebih dekat, crop dulu, atau guna screenshot kecil.');
}

export function FormModal({
  title,
  fields,
  initialValues,
  onClose,
  onSubmit,
}: {
  title: string;
  fields: FieldConfig[];
  initialValues?: Record<string, string>;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    const defaults = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = initialValues?.[field.name] ?? field.options?.[0] ?? '';
      return acc;
    }, {});
    setValues(defaults);
    setFieldError('');
  }, [fields, initialValues]);

  return (
    <div className="fixed inset-0 z-50 bg-cocoa/35 px-4 py-5 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-md flex-col overflow-hidden rounded-[28px] bg-cream shadow-soft">
        <div className="flex items-center justify-between border-b border-white px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white text-cocoa" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <form
          className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (isProcessingImage || isSubmitting) return;
            setIsSubmitting(true);
            try {
              setFieldError('');
              await Promise.resolve(onSubmit(values));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {fields.map((field) => (
            <label key={field.name} className="block">
              <span className="mb-2 block text-sm font-semibold text-cocoa/80">{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea
                  value={values[field.name] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  rows={4}
                  placeholder={field.placeholder}
                  className="min-h-[110px] w-full rounded-[20px] border border-oat bg-white px-4 py-3 text-sm outline-none transition focus:border-peachDeep focus:ring-4 focus:ring-peach/25"
                />
              ) : field.type === 'image' ? (
                <div className="space-y-3">
                  {values[field.name] ? <img src={values[field.name]} alt="" className="h-36 w-full rounded-[20px] object-cover" /> : null}
                  <input
                    type="url"
                    value={values[field.name] ?? ''}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    placeholder={field.placeholder ?? 'URL gambar atau upload dari telefon'}
                    className="h-12 w-full rounded-[20px] border border-oat bg-white px-4 text-sm outline-none transition focus:border-peachDeep focus:ring-4 focus:ring-peach/25"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isProcessingImage || isSubmitting}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setIsProcessingImage(true);
                      setFieldError('');
                      try {
                        const imageUrl = await resizeImage(file);
                        setValues((current) => ({ ...current, [field.name]: imageUrl }));
                      } catch (error) {
                        const message = error instanceof Error ? error.message : 'Gagal proses gambar.';
                        setFieldError(message);
                      } finally {
                        setIsProcessingImage(false);
                      }
                    }}
                    className="w-full rounded-[20px] border border-dashed border-oat bg-white px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-peach file:px-4 file:py-2 file:font-semibold file:text-white"
                  />
                  {isProcessingImage ? <p className="text-xs font-semibold text-cocoa/55">Memproses gambar...</p> : null}
                  {fieldError ? <p className="text-xs font-semibold text-berry">{fieldError}</p> : null}
                </div>
              ) : field.type === 'select' ? (
                <select
                  value={values[field.name] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  className="h-12 w-full rounded-[20px] border border-oat bg-white px-4 text-sm outline-none transition focus:border-peachDeep focus:ring-4 focus:ring-peach/25"
                >
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type ?? 'text'}
                  value={values[field.name] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  placeholder={field.placeholder}
                  className="h-12 w-full rounded-[20px] border border-oat bg-white px-4 text-sm outline-none transition focus:border-peachDeep focus:ring-4 focus:ring-peach/25"
                />
              )}
            </label>
          ))}

          <div className="sticky bottom-0 grid grid-cols-2 gap-3 bg-cream pt-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="h-12 rounded-[18px] bg-white font-semibold text-cocoa shadow-sm disabled:opacity-60">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingImage}
              className="h-12 rounded-[18px] bg-sage font-semibold text-white shadow-soft disabled:opacity-60"
            >
              {isProcessingImage ? 'Proses Gambar' : isSubmitting ? 'Menyimpan' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
