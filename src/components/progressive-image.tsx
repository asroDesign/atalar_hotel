"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { imagePreviewUrl } from "@/lib/media";

type ProgressiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onLoad" | "onError"> & {
  src: string;
  previewOnly?: boolean;
};

/** Loads the small server-generated image first, then fades in the original. */
export function ProgressiveImage({ src, alt = "", className, previewOnly = false, ...props }: ProgressiveImageProps) {
  const previewSrc = imagePreviewUrl(src);
  const previewRef = useRef<HTMLImageElement>(null);
  const originalRef = useRef<HTMLImageElement>(null);
  const [loadedPreviewFor, setLoadedPreviewFor] = useState("");
  const [failedPreviewFor, setFailedPreviewFor] = useState("");
  const [loadedOriginalFor, setLoadedOriginalFor] = useState("");
  const hasPreview = !!previewSrc && failedPreviewFor !== src;
  const previewReady = loadedPreviewFor === src;
  const shouldLoadOriginal = !previewOnly && (!previewSrc || failedPreviewFor === src || previewReady);
  const useOriginalAsPreviewFallback = previewOnly && !hasPreview;

  useEffect(() => {
    const preview = previewRef.current;
    if (preview && preview.complete) {
      if (preview.naturalWidth > 0) setLoadedPreviewFor(src);
      else setFailedPreviewFor(src);
    }
  }, [previewSrc, src]);

  useEffect(() => {
    const original = originalRef.current;
    if (original && original.complete && original.naturalWidth > 0) setLoadedOriginalFor(src);
  }, [shouldLoadOriginal, src]);

  return (
    <>
      {hasPreview && (
        <img
          {...props}
          ref={previewRef}
          key={`preview:${src}`}
          src={previewSrc!}
          alt=""
          aria-hidden="true"
          decoding={props.decoding ?? "async"}
          className={cn(className, "opacity-100 transition-opacity duration-300")}
          onLoad={() => setLoadedPreviewFor(src)}
          onError={() => setFailedPreviewFor(src)}
        />
      )}
      {(shouldLoadOriginal || useOriginalAsPreviewFallback) && (
        <img
          {...props}
          ref={originalRef}
          key={`original:${src}`}
          src={src}
          alt={alt}
          decoding={props.decoding ?? "async"}
          className={cn(
            className,
            !previewOnly && hasPreview && "transition-opacity duration-500",
            !previewOnly && hasPreview && loadedOriginalFor !== src ? "opacity-0" : "opacity-100",
          )}
          onLoad={() => setLoadedOriginalFor(src)}
        />
      )}
    </>
  );
}
