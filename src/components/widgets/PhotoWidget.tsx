import React from 'react';
import { WidgetOfType } from '@/types';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PhotoWidgetProps {
  widget: WidgetOfType<'photo-frame'>;
}

export default function PhotoWidget({ widget }: PhotoWidgetProps) {
  const t = useTranslations('Widgets');
  const imageUrls = React.useMemo(() => {
    const candidates = widget.config.images?.length ? widget.config.images : [widget.config.imageUrl];
    return candidates.map((item) => item?.trim()).filter(Boolean) as string[];
  }, [widget.config.imageUrl, widget.config.images]);
  const autoplay = widget.config.autoplay ?? true;
  const interval = widget.config.interval ?? 5000;
  const shuffle = widget.config.shuffle ?? false;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(imageUrls.length > 0);
  const [failedImages, setFailedImages] = React.useState<string[]>([]);

  React.useEffect(() => {
    setCurrentIndex(0);
    setIsLoading(imageUrls.length > 0);
    setFailedImages([]);
  }, [imageUrls]);

  const availableImages = React.useMemo(
    () => imageUrls.filter((item) => !failedImages.includes(item)),
    [failedImages, imageUrls]
  );

  React.useEffect(() => {
    if (currentIndex > availableImages.length - 1) {
      setCurrentIndex(0);
    }
  }, [availableImages.length, currentIndex]);

  React.useEffect(() => {
    if (!autoplay || availableImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (shuffle && availableImages.length > 1) {
          let next = prev;
          while (next === prev) {
            next = Math.floor(Math.random() * availableImages.length);
          }
          return next;
        }

        return (prev + 1) % availableImages.length;
      });
    }, interval);

    return () => window.clearInterval(timer);
  }, [autoplay, availableImages.length, interval, shuffle]);

  const currentImage = availableImages[currentIndex];

  React.useEffect(() => {
    setIsLoading(Boolean(currentImage));
  }, [currentImage]);

  if (!imageUrls.length) {
    return (
      <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 p-4">
        <ImageIcon size={32} className="mb-2 opacity-50" />
        <span className="text-xs text-center">{t('no_images_selected')}</span>
      </div>
    );
  }

  if (!currentImage) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gray-50 p-4 text-center text-gray-400">
        <AlertCircle size={28} className="mb-2 opacity-60" />
        <span className="text-xs">{t('photo_load_error')}</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={currentImage}
        src={currentImage}
        alt="Widget Photo"
        className="h-full w-full object-cover transition-opacity duration-500"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setFailedImages((current) => (current.includes(currentImage) ? current : [...current, currentImage]));
        }}
      />
    </div>
  );
}
