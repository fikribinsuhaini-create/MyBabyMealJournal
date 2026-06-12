import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

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

  const maxSize = 760;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
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
  onSubmit: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const defaults = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = initialValues?.[field.name] ?? field.options?.[0] ?? '';
      return acc;
    }, {});
    setValues(defaults);
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
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(values);
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
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const imageUrl = await resizeImage(file);
                      setValues((current) => ({ ...current, [field.name]: imageUrl }));
                    }}
                    className="w-full rounded-[20px] border border-dashed border-oat bg-white px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-peach file:px-4 file:py-2 file:font-semibold file:text-white"
                  />
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
            <button type="button" onClick={onClose} className="h-12 rounded-[18px] bg-white font-semibold text-cocoa shadow-sm">
              Batal
            </button>
            <button type="submit" className="h-12 rounded-[18px] bg-sage font-semibold text-white shadow-soft">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
