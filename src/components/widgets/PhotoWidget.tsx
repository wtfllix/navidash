import React from 'react';
import { WidgetOfType } from '@/types';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createResizeObserver } from '@/lib/resizeObserver';
import {
  getPosterThumbnailUrl,
  getPosterThumbnailWidth,
  isExternalPosterImage,
} from '@/lib/posterThumbnail';

interface PhotoWidgetProps {
  widget: WidgetOfType<'photo-frame'>;
}

const readyPosterThumbnails = new Set<string>();

function useProgressivePosterSource(source: string | null, thumbnailWidth: number | null) {
  const thumbnailUrl = React.useMemo(() => {
    if (!source || !thumbnailWidth || !isExternalPosterImage(source)) return null;
    return getPosterThumbnailUrl(source, thumbnailWidth);
  }, [source, thumbnailWidth]);
  const [readyThumbnail, setReadyThumbnail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!thumbnailUrl || readyPosterThumbnails.has(thumbnailUrl)) return;

    let active = true;
    let retryTimer: number | null = null;
    let retryCount = 0;

    const preloadThumbnail = () => {
      const image = new Image();
      image.onload = () => {
        readyPosterThumbnails.add(thumbnailUrl);
        if (active) setReadyThumbnail(thumbnailUrl);
      };
      image.onerror = () => {
        if (!active || retryCount >= 2) return;
        retryCount += 1;
        retryTimer = window.setTimeout(preloadThumbnail, retryCount * 1500);
      };
      image.src = thumbnailUrl;
    };

    preloadThumbnail();

    return () => {
      active = false;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
    };
  }, [thumbnailUrl]);

  if (thumbnailUrl && (readyThumbnail === thumbnailUrl || readyPosterThumbnails.has(thumbnailUrl))) {
    return thumbnailUrl;
  }

  return source;
}

export default function PhotoWidget({ widget }: PhotoWidgetProps) {
  const t = useTranslations('Widgets');
  const imageUrls = React.useMemo(() => {
    const candidates = widget.config.images?.length ? widget.config.images : [widget.config.imageUrl];
    return candidates.map((item) => item?.trim()).filter(Boolean) as string[];
  }, [widget.config.imageUrl, widget.config.images]);
  const autoplay = widget.config.autoplay ?? false;
  const interval = widget.config.interval ?? 5000;
  const shuffle = widget.config.shuffle ?? false;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(imageUrls.length > 0);
  const [failedImages, setFailedImages] = React.useState<string[]>([]);
  const [displayedImage, setDisplayedImage] = React.useState<string | null>(null);
  const [incomingImage, setIncomingImage] = React.useState<string | null>(null);
  const [isIncomingVisible, setIsIncomingVisible] = React.useState(false);
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const [thumbnailWidth, setThumbnailWidth] = React.useState<number | null>(null);

  const refreshThumbnailWidth = React.useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;

    setThumbnailWidth(
      getPosterThumbnailWidth(
        frame.getBoundingClientRect().width,
        window.devicePixelRatio || 1
      )
    );
  }, []);

  React.useEffect(() => {
    setCurrentIndex(0);
    setIsLoading(imageUrls.length > 0);
    setFailedImages([]);
    setDisplayedImage(null);
    setIncomingImage(null);
    setIsIncomingVisible(false);
  }, [imageUrls]);

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    refreshThumbnailWidth();
    const observer = createResizeObserver(refreshThumbnailWidth);
    observer?.observe(frame);
    window.addEventListener('resize', refreshThumbnailWidth);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', refreshThumbnailWidth);
    };
  }, [refreshThumbnailWidth]);

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
  const displayedSource = useProgressivePosterSource(
    displayedImage ?? currentImage ?? null,
    thumbnailWidth
  );
  const incomingSource = useProgressivePosterSource(incomingImage, thumbnailWidth);

  React.useEffect(() => {
    if (!currentImage) {
      setDisplayedImage(null);
      setIncomingImage(null);
      setIsIncomingVisible(false);
      setIsLoading(false);
      return;
    }

    if (!displayedImage) {
      setDisplayedImage(currentImage);
      setIncomingImage(null);
      setIsIncomingVisible(false);
      setIsLoading(true);
      return;
    }

    if (currentImage === displayedImage) {
      setIncomingImage(null);
      setIsIncomingVisible(false);
      return;
    }

    setIncomingImage(currentImage);
    setIsIncomingVisible(false);
    setIsLoading(true);
  }, [currentImage, displayedImage]);

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
    <div ref={frameRef} className="relative h-full w-full overflow-hidden bg-gray-100">
      {isLoading && !displayedImage && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displayedSource ?? currentImage}
        alt="Widget Photo"
        className="h-full w-full object-cover"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          if (!currentImage) return;
          setDisplayedImage(null);
          setFailedImages((current) => (current.includes(currentImage) ? current : [...current, currentImage]));
        }}
      />
      {incomingImage ? (
        // Keep the current image mounted underneath so the next one can fade in smoothly.
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={incomingSource ?? incomingImage}
          alt="Widget Photo"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isIncomingVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            setIsLoading(false);
            requestAnimationFrame(() => {
              setIsIncomingVisible(true);
            });
          }}
          onTransitionEnd={(event) => {
            if (event.propertyName !== 'opacity' || !isIncomingVisible) return;
            setDisplayedImage(incomingImage);
            setIncomingImage(null);
            setIsIncomingVisible(false);
          }}
          onError={() => {
            setIsLoading(false);
            setIncomingImage(null);
            setIsIncomingVisible(false);
            setFailedImages((current) => (current.includes(incomingImage) ? current : [...current, incomingImage]));
          }}
        />
      ) : null}
    </div>
  );
}
