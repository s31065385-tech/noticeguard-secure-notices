import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ImageUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ScanState = "idle" | "starting" | "scanning" | "error";

async function decodeImageData(data: ImageData, attemptBoth = false) {
  const { default: jsQR } = await import("jsqr");
  return jsQR(data.data, data.width, data.height, {
    inversionAttempts: attemptBoth ? "attemptBoth" : "dontInvert",
  });
}

export function QrScanner({ onDetected }: { onDetected: (payload: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);

  const releaseCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => releaseCamera, [releaseCamera]);

  const stop = () => {
    releaseCamera();
    setState("idle");
  };

  const tick = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;
    if (video.readyState >= 2 && !busyRef.current) {
      busyRef.current = true;
      const scale = Math.min(1, 720 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const code = await decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (code?.data) {
          busyRef.current = false;
          releaseCamera();
          setState("idle");
          onDetected(code.data);
          return;
        }
      }
      busyRef.current = false;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onDetected, releaseCamera]);

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access isn't supported in this browser. Upload a photo of the QR code instead.");
      setState("error");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setState("scanning");
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      releaseCamera();
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access or upload a QR image."
          : name === "NotFoundError"
            ? "No camera was found on this device. Upload a QR image instead."
            : "The camera could not be started. Upload a QR image instead.",
      );
      setState("error");
    }
  }

  async function handleFile(file: File) {
    setError(null);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const code = await decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), true);
      if (code?.data) onDetected(code.data);
      else setError("No QR code was found in that image. Try a sharper, well-lit photo.");
    } catch {
      setError("That file could not be read as an image.");
    }
  }

  const active = state === "scanning" || state === "starting";

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border bg-muted/40 shadow-glow">
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn("absolute inset-0 size-full object-cover", !active && "invisible")}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-grid p-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-glow-pulse rounded-full bg-primary/25 blur-xl" />
              <Camera className="relative size-10 text-primary" />
            </div>
            <p className="max-w-[16rem] text-sm text-muted-foreground">
              Point your camera at a NoticeGuard QR code to open the registered notice.
            </p>
          </div>
        )}

        {/* Viewfinder corners */}
        <div className="pointer-events-none absolute inset-6">
          {["left-0 top-0 border-l-2 border-t-2 rounded-tl-lg", "right-0 top-0 border-r-2 border-t-2 rounded-tr-lg", "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg"].map((c) => (
            <span key={c} className={cn("absolute size-8 border-primary", c)} />
          ))}
          {state === "scanning" && <span className="absolute inset-x-2 h-0.5 animate-scan rounded-full scan-beam" />}
        </div>

        {state === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {active ? (
          <Button variant="danger" size="lg" onClick={stop}>
            <CameraOff /> Stop camera
          </Button>
        ) : (
          <Button variant="hero" size="lg" onClick={start}>
            <Camera /> Start camera scan
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={() => fileRef.current?.click()}>
          <ImageUp /> Upload QR image
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
