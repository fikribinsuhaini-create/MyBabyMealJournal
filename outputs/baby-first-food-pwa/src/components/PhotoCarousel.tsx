import { useEffect, useState } from 'react';

export function PhotoCarousel({
  images,
  alt,
  intervalMs = 3500,
  heightClassName = 'h-56',
}: {
  images: string[];
  alt: string;
  intervalMs?: number;
  heightClassName?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images, intervalMs]);

  if (!images.length) return null;

  return (
    <div className="relative">
      <img src={images[index]} alt={alt} className={`w-full object-cover ${heightClassName}`} />
      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {images.map((url, dotIndex) => (
            <button
              key={`${url}-${dotIndex}`}
              type="button"
              aria-label={`Gambar ${dotIndex + 1}`}
              onClick={() => setIndex(dotIndex)}
              className={`h-1.5 rounded-full transition-all ${dotIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
