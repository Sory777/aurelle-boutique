"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoProduct } from "@/lib/demo-data";

type TryOnStudioProps = {
  product: DemoProduct;
};

/** A pair of 2D points used to anchor the garment overlay to the body. */
type Anchor = { x: number; y: number };
type PoseAnchors = {
  leftShoulder: Anchor | null;
  rightShoulder: Anchor | null;
  leftHip: Anchor | null;
  rightHip: Anchor | null;
};

type PoseStatus =
  | "idle"
  | "detecting"
  | "detected"
  | "no_pose"
  | "unsupported";

const MAX_CANVAS_WIDTH = 760;
const KEYPOINT_SCORE_THRESHOLD = 0.3;

/** Quick, synchronous WebGL capability probe (gates the on-device ML path). */
function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

/** Load an image and resolve once decoded. Garments are loaded cross-origin. */
function loadImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    image.src = src;
  });
}

/**
 * The visual try-on studio. Everything runs in the browser:
 *
 *  - the shopper supplies a photo (upload) or a live-camera frame (`getUserMedia`);
 *  - TensorFlow.js + MoveNet (loaded dynamically, models fetched from a CDN at
 *    runtime) detect shoulder/hip keypoints on-device;
 *  - the selected garment image is composited onto a `<canvas>` over the photo,
 *    anchored to the detected keypoints (with a graceful centered fallback).
 *
 * The user's image never leaves the device — no uploads, no server round-trip.
 */
export function TryOnStudio({ product }: TryOnStudioProps) {
  // Garment variants: pair each colorway with a gallery image (best-effort).
  const garmentImages =
    product.images.length > 0 ? product.images : [product.image];
  const sizes = product.sizes.length > 0 ? product.sizes : ["Única"];
  const medianSizeIndex = Math.floor((sizes.length - 1) / 2);

  // --- Capture / source state -------------------------------------------------
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poseStatus, setPoseStatus] = useState<PoseStatus>("idle");

  // --- Overlay controls -------------------------------------------------------
  const [opacity, setOpacity] = useState(0.85);
  const [overlayScale, setOverlayScale] = useState(1);
  const [sizeIndex, setSizeIndex] = useState(medianSizeIndex);
  const [variantIndex, setVariantIndex] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [sizeAIndex, setSizeAIndex] = useState(Math.max(0, medianSizeIndex - 1));
  const [sizeBIndex, setSizeBIndex] = useState(
    Math.min(sizes.length - 1, medianSizeIndex + 1),
  );

  // --- Version counters that trigger redraws when refs change -----------------
  const [userReadyVersion, setUserReadyVersion] = useState(0);
  const [garmentVersion, setGarmentVersion] = useState(0);

  // --- Refs (non-reactive working state) --------------------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasARef = useRef<HTMLCanvasElement | null>(null);
  const canvasBRef = useRef<HTMLCanvasElement | null>(null);
  const userImgRef = useRef<HTMLImageElement | null>(null);
  const garmentImgRef = useRef<HTMLImageElement | null>(null);
  const anchorsRef = useRef<PoseAnchors | null>(null);
  const dimsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  /** Convert a size index into a relative overlay scale factor. */
  const sizeScaleFor = useCallback(
    (index: number) => {
      const delta = index - medianSizeIndex;
      return Math.min(1.5, Math.max(0.7, 1 + delta * 0.06));
    },
    [medianSizeIndex],
  );

  // --- Camera lifecycle -------------------------------------------------------
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Tu navegador no permite el acceso a la cámara.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setError(
        "No pudimos acceder a la cámara. Revisa los permisos del navegador.",
      );
      setCameraActive(false);
    }
  }, []);

  // Attach the active stream to the video element once it is mounted.
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {
        /* autoplay can be deferred; user can still capture */
      });
    }
  }, [cameraActive]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const capture = document.createElement("canvas");
    capture.width = video.videoWidth;
    capture.height = video.videoHeight;
    const ctx = capture.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, capture.width, capture.height);
    const dataUrl = capture.toDataURL("image/jpeg", 0.92);
    stopCamera();
    setImageSrc((previous) => {
      if (previous && previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return dataUrl;
    });
  }, [stopCamera]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setError(null);
      stopCamera();
      const url = URL.createObjectURL(file);
      setImageSrc((previous) => {
        if (previous && previous.startsWith("blob:")) {
          URL.revokeObjectURL(previous);
        }
        return url;
      });
    },
    [stopCamera],
  );

  // --- On-device pose detection (TensorFlow.js + MoveNet) ---------------------
  const detectAnchors = useCallback(
    async (image: HTMLImageElement, scale: number): Promise<PoseAnchors | null> => {
      // Dynamic imports keep these heavy libraries out of SSR / the main bundle.
      const tf: any = await import("@tensorflow/tfjs");
      const poseDetection: any = await import(
        "@tensorflow-models/pose-detection"
      );
      await tf.ready();

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType:
            poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        },
      );

      try {
        const poses = await detector.estimatePoses(image);
        if (!poses || poses.length === 0) {
          return null;
        }
        const byName: Record<string, { x: number; y: number; score?: number }> =
          {};
        for (const keypoint of poses[0].keypoints) {
          if (keypoint.name) byName[keypoint.name] = keypoint;
        }
        const pick = (name: string): Anchor | null => {
          const keypoint = byName[name];
          if (!keypoint) return null;
          if (
            typeof keypoint.score === "number" &&
            keypoint.score < KEYPOINT_SCORE_THRESHOLD
          ) {
            return null;
          }
          return { x: keypoint.x * scale, y: keypoint.y * scale };
        };

        const anchors: PoseAnchors = {
          leftShoulder: pick("left_shoulder"),
          rightShoulder: pick("right_shoulder"),
          leftHip: pick("left_hip"),
          rightHip: pick("right_hip"),
        };

        if (!anchors.leftShoulder || !anchors.rightShoulder) {
          return null;
        }
        return anchors;
      } finally {
        detector.dispose?.();
      }
    },
    [],
  );

  // --- Drawing ----------------------------------------------------------------
  const drawComposite = useCallback(
    (canvas: HTMLCanvasElement | null, sizeIdx: number) => {
      const userImg = userImgRef.current;
      const { width, height } = dimsRef.current;
      if (!canvas || !userImg || width === 0 || height === 0) return;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(userImg, 0, 0, width, height);

      // Before/after: show the untouched photo with no overlay.
      if (showOriginal) return;

      const garment = garmentImgRef.current;
      if (!garment) return;

      const anchors = anchorsRef.current;
      const sizeScale = sizeScaleFor(sizeIdx);

      let centerX: number;
      let topY: number;
      let garmentWidth: number;

      if (anchors?.leftShoulder && anchors.rightShoulder) {
        const ls = anchors.leftShoulder;
        const rs = anchors.rightShoulder;
        const shoulderDist = Math.hypot(rs.x - ls.x, rs.y - ls.y) || width * 0.3;
        centerX = (ls.x + rs.x) / 2;
        const shoulderY = (ls.y + rs.y) / 2;
        topY = shoulderY - shoulderDist * 0.35;
        garmentWidth = shoulderDist * 2.3 * overlayScale * sizeScale;
      } else {
        // Graceful fallback: center the garment on the torso area.
        garmentWidth = width * 0.6 * overlayScale * sizeScale;
        centerX = width / 2;
        topY = height * 0.14;
      }

      const aspect =
        garment.naturalWidth > 0
          ? garment.naturalHeight / garment.naturalWidth
          : 1.3;
      const garmentHeight = garmentWidth * aspect;
      const drawX = centerX - garmentWidth / 2;

      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0, opacity));
      ctx.drawImage(garment, drawX, topY, garmentWidth, garmentHeight);
      ctx.restore();
    },
    [opacity, overlayScale, showOriginal, sizeScaleFor],
  );

  // Process a newly supplied image: size the canvas, run pose detection.
  useEffect(() => {
    if (!imageSrc) return;
    let cancelled = false;

    (async () => {
      setIsProcessing(true);
      setError(null);
      setPoseStatus("detecting");
      try {
        const image = await loadImage(imageSrc, false);
        if (cancelled) return;

        const scale = Math.min(1, MAX_CANVAS_WIDTH / image.naturalWidth);
        const width = Math.round(image.naturalWidth * scale) || MAX_CANVAS_WIDTH;
        const height =
          Math.round(image.naturalHeight * scale) ||
          Math.round(MAX_CANVAS_WIDTH * 1.3);

        userImgRef.current = image;
        dimsRef.current = { width, height };

        if (!isWebGLAvailable()) {
          // Unsupported device: still render a centered overlay fallback.
          anchorsRef.current = null;
          if (!cancelled) setPoseStatus("unsupported");
        } else {
          try {
            const anchors = await detectAnchors(image, scale);
            if (cancelled) return;
            anchorsRef.current = anchors;
            setPoseStatus(anchors ? "detected" : "no_pose");
          } catch {
            if (cancelled) return;
            anchorsRef.current = null;
            setPoseStatus("no_pose");
          }
        }

        if (!cancelled) setUserReadyVersion((value) => value + 1);
      } catch {
        if (!cancelled) {
          setError(
            "No pudimos procesar la imagen. Intenta con otra foto más clara.",
          );
          setPoseStatus("idle");
        }
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageSrc, detectAnchors]);

  // Load the selected garment image (cross-origin) whenever the variant changes.
  useEffect(() => {
    let cancelled = false;
    const src = garmentImages[variantIndex] ?? product.image;
    loadImage(src, true)
      .then((image) => {
        if (!cancelled) {
          garmentImgRef.current = image;
          setGarmentVersion((value) => value + 1);
        }
      })
      .catch(() => {
        /* a missing garment image simply leaves the previous overlay */
      });
    return () => {
      cancelled = true;
    };
  }, [variantIndex, garmentImages, product.image]);

  // Redraw whenever the image, garment, or any overlay control changes.
  useEffect(() => {
    if (!userImgRef.current) return;
    drawComposite(canvasRef.current, sizeIndex);
    if (compareMode) {
      drawComposite(canvasARef.current, sizeAIndex);
      drawComposite(canvasBRef.current, sizeBIndex);
    }
  }, [
    drawComposite,
    sizeIndex,
    sizeAIndex,
    sizeBIndex,
    compareMode,
    userReadyVersion,
    garmentVersion,
  ]);

  // Cleanup on unmount: stop the camera and revoke any object URL.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retakeNotice =
    poseStatus === "no_pose"
      ? "No detectamos una pose completa. Probamos con un encuadre centrado — vuelve a capturar de frente y con buena luz para un ajuste más preciso."
      : poseStatus === "unsupported"
        ? "Tu dispositivo no admite el ajuste asistido por IA. Mostramos una superposición centrada como alternativa; tu foto sigue sin salir de tu dispositivo."
        : null;

  const hasImage = Boolean(imageSrc);

  return (
    <div className="border border-line bg-white/40 p-6 sm:p-8">
      <p className="eyebrow text-champagne-deep">Probador virtual</p>
      <h2 className="mt-2 font-display text-2xl font-medium text-noir">
        Pruébalo en ti
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-taupe">
        Sube una foto o usa tu cámara para ver cómo luce «{product.name}» sobre
        tu cuerpo. Ajusta la talla, el tamaño y la opacidad a tu gusto.
      </p>

      {/* Privacy note */}
      <p className="mt-4 inline-flex items-center gap-2 border border-line bg-blush/40 px-4 py-2 text-xs text-taupe">
        <span aria-hidden>•</span>
        Tu foto se procesa en tu dispositivo y nunca se sube.
      </p>

      {/* Capture controls */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-ghost"
        >
          Subir foto
        </button>
        {cameraActive ? (
          <>
            <button type="button" onClick={capturePhoto} className="btn-primary">
              Capturar
            </button>
            <button type="button" onClick={stopCamera} className="btn-ghost">
              Detener cámara
            </button>
          </>
        ) : (
          <button type="button" onClick={startCamera} className="btn-ghost">
            Usar cámara
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      {/* Live camera preview */}
      {cameraActive && (
        <div className="mt-6 overflow-hidden border border-line bg-noir/5">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-auto w-full"
            aria-label="Vista previa de la cámara"
          />
        </div>
      )}

      {/* Render surface */}
      {hasImage && !cameraActive && (
        <div className="mt-6">
          {isProcessing && (
            <p
              role="status"
              aria-live="polite"
              className="mb-3 text-sm text-taupe"
            >
              Analizando tu foto en el dispositivo…
            </p>
          )}

          {retakeNotice && !isProcessing && (
            <p
              role="status"
              aria-live="polite"
              className="mb-3 border-l-2 border-warn pl-3 text-sm text-taupe"
            >
              {retakeNotice}
            </p>
          )}

          {compareMode ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <figure className="overflow-hidden border border-line bg-blush/30">
                <canvas ref={canvasARef} className="h-auto w-full" />
                <figcaption className="border-t border-line px-3 py-2 text-center text-xs uppercase tracking-eyebrow text-taupe">
                  Talla {sizes[sizeAIndex]}
                </figcaption>
              </figure>
              <figure className="overflow-hidden border border-line bg-blush/30">
                <canvas ref={canvasBRef} className="h-auto w-full" />
                <figcaption className="border-t border-line px-3 py-2 text-center text-xs uppercase tracking-eyebrow text-taupe">
                  Talla {sizes[sizeBIndex]}
                </figcaption>
              </figure>
            </div>
          ) : (
            <div className="overflow-hidden border border-line bg-blush/30">
              <canvas ref={canvasRef} className="h-auto w-full" />
            </div>
          )}
        </div>
      )}

      {/* Overlay controls */}
      {hasImage && !cameraActive && (
        <div className="mt-6 space-y-6">
          {/* Variant / garment switcher */}
          {garmentImages.length > 1 && (
            <div>
              <p className="eyebrow">Color / variante</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.colors.map((color, index) => {
                  const targetVariant = index % garmentImages.length;
                  const isActive = targetVariant === variantIndex;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setVariantIndex(targetVariant)}
                      title={color.name}
                      aria-label={`Variante ${color.name}`}
                      aria-pressed={isActive}
                      className={`h-9 w-9 rounded-full border transition-all duration-300 ease-luxe ${
                        isActive
                          ? "border-champagne-deep ring-1 ring-champagne-deep ring-offset-2 ring-offset-ivory"
                          : "border-line hover:border-taupe"
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Before / after + compare toggles */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowOriginal((value) => !value)}
              aria-pressed={showOriginal}
              className={`border px-4 py-2 text-xs uppercase tracking-eyebrow transition-all duration-300 ease-luxe ${
                showOriginal
                  ? "border-noir bg-noir text-ivory"
                  : "border-line text-noir hover:border-noir"
              }`}
            >
              {showOriginal ? "Viendo: original" : "Ver original"}
            </button>
            <button
              type="button"
              onClick={() => setCompareMode((value) => !value)}
              aria-pressed={compareMode}
              className={`border px-4 py-2 text-xs uppercase tracking-eyebrow transition-all duration-300 ease-luxe ${
                compareMode
                  ? "border-noir bg-noir text-ivory"
                  : "border-line text-noir hover:border-noir"
              }`}
            >
              Comparar dos tallas
            </button>
          </div>

          {/* Size simulation */}
          {!compareMode ? (
            <div>
              <p className="eyebrow">Simular talla</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {sizes.map((size, index) => {
                  const isActive = index === sizeIndex;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSizeIndex(index)}
                      aria-pressed={isActive}
                      className={`min-w-[3rem] border px-4 py-2.5 text-xs uppercase tracking-eyebrow transition-all duration-300 ease-luxe ${
                        isActive
                          ? "border-noir bg-noir text-ivory"
                          : "border-line text-noir hover:border-noir"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="eyebrow">Talla A</span>
                <select
                  value={sizeAIndex}
                  onChange={(event) =>
                    setSizeAIndex(Number(event.target.value))
                  }
                  className="mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm text-noir outline-none focus:border-champagne-deep"
                >
                  {sizes.map((size, index) => (
                    <option key={size} value={index}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">Talla B</span>
                <select
                  value={sizeBIndex}
                  onChange={(event) =>
                    setSizeBIndex(Number(event.target.value))
                  }
                  className="mt-2 w-full border border-line bg-ivory px-4 py-3 text-sm text-noir outline-none focus:border-champagne-deep"
                >
                  {sizes.map((size, index) => (
                    <option key={size} value={index}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* Sliders */}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="flex items-center justify-between text-xs uppercase tracking-eyebrow text-taupe">
                <span>Tamaño de la prenda</span>
                <span className="tabular-nums">
                  {Math.round(overlayScale * 100)}%
                </span>
              </span>
              <input
                type="range"
                min={0.6}
                max={1.6}
                step={0.02}
                value={overlayScale}
                onChange={(event) =>
                  setOverlayScale(Number(event.target.value))
                }
                className="mt-3 w-full accent-champagne-deep"
              />
            </label>
            <label className="block">
              <span className="flex items-center justify-between text-xs uppercase tracking-eyebrow text-taupe">
                <span>Opacidad</span>
                <span className="tabular-nums">
                  {Math.round(opacity * 100)}%
                </span>
              </span>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.02}
                value={opacity}
                onChange={(event) => setOpacity(Number(event.target.value))}
                className="mt-3 w-full accent-champagne-deep"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default TryOnStudio;
