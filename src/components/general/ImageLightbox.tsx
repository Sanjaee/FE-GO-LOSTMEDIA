// components/ImageLightbox.tsx
import React, { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

interface ImageLightboxProps {
  // Single image props
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;

  // Gallery props
  images?: string[];
  currentIndex?: number;
  onClose?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  src,
  alt = "Image",
  width = 1000,
  height = 500,
  priority = false,
  className = "w-full h-auto",
  images,
  currentIndex = 0,
  onClose,
  onNext,
  onPrev,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Handle single image
  if (src && !images) {
    return (
      <>
        <div
          className="relative overflow-hidden shadow-md cursor-pointer"
          onClick={() => setIsOpen(true)}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`${className} transition-transform hover:scale-105 object-contain`}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        </div>

        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          slides={[{ src, width: 1920, height: 1080 }]}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            scrollToZoom: true,
            doubleClickMaxStops: 2,
            doubleClickDelay: 300,
          }}
          carousel={{ finite: true }}
          styles={{
            container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
            root: { "--yarl__color_backdrop": "rgba(0, 0, 0, 0.9)" },
          }}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
        />
      </>
    );
  }

  // Handle image gallery
  if (images && images.length > 0) {
    const slides = images.map((imageSrc) => ({
      src: imageSrc,
      width: 1920,
      height: 1080,
    }));

    return (
      <Lightbox
        open={isOpen}
        close={() => {
          setIsOpen(false);
          onClose?.();
        }}
        slides={slides}
        index={currentIndex}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
          doubleClickMaxStops: 2,
          doubleClickDelay: 300,
        }}
        carousel={{ finite: true }}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.9)" },
          root: { "--yarl__color_backdrop": "rgba(0, 0, 0, 0.9)" },
        }}
        render={{
          buttonPrev: onPrev ? undefined : () => null,
          buttonNext: onNext ? undefined : () => null,
        }}
      />
    );
  }

  return null;
};

export default ImageLightbox;
