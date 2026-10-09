"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, ImageUp, Keyboard, Square } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompanyText } from "@/features/companies/company-provider";

async function createReader() {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import("@zxing/browser"), import("@zxing/library"),
  ]);
  return new BrowserMultiFormatReader(new Map<import("@zxing/library").DecodeHintType, unknown>([[DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39, BarcodeFormat.ITF, BarcodeFormat.DATA_MATRIX,
  ]], [DecodeHintType.TRY_HARDER, true]]), { delayBetweenScanAttempts: 250, delayBetweenScanSuccess: 1000 });
}

/** Decodes locally. Permission is requested only after the camera button is pressed. */
export function CodeReader({ onRead, disabled = false }: { onRead: (code: string) => void; disabled?: boolean }) {
  const t = useCompanyText();
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [camera, setCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const controls = useRef<IScannerControls | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const callback = useRef(onRead);
  useEffect(() => { callback.current = onRead; }, [onRead]);

  const release = useCallback(() => {
    generation.current++;
    controls.current?.stop();
    controls.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);
  const stop = useCallback(() => {
    release();
    setCamera(false);
    setLoading(false);
  }, [release]);
  useEffect(() => {
    function hide() {
      if (document.hidden) stop();
    }
    function leave() { stop(); }
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    return () => {
      release();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
    };
  }, [release, stop]);
  useEffect(() => {
    if (!disabled) return;
    const cancellation = window.setTimeout(stop, 0);
    return () => window.clearTimeout(cancellation);
  }, [disabled, stop]);

  function deliver(code: string) {
    stop();
    const trimmed = code.trim();
    if (!trimmed || trimmed.length > 200 || /[\u0000-\u001f\u007f]/.test(trimmed)) {
      setError(t("Kod boş veya desteklenmeyen uzunlukta/biçimde.", "The code is empty or has an unsupported length/format."));
      return;
    }
    setError("");
    setValue(trimmed);
    callback.current(trimmed);
  }

  async function start() {
    stop();
    setError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(t("Kamera için HTTPS veya localhost kullanın. USB okuyucu ve görsel yükleme kullanılabilir.", "Use HTTPS or localhost for camera access. USB readers and image upload are available."));
      return;
    }
    const run = generation.current;
    setLoading(true);
    setCamera(true);
    try {
      const reader = await createReader();
      if (run !== generation.current) return;
      const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 },
      } });
      if (run !== generation.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      if (!video.current) { stop(); return; }
      let found = false;
      const scanner = await reader.decodeFromStream(media, video.current, (result, scanError, scannerControls) => {
        if (scanError && run === generation.current && !["NotFoundException", "ChecksumException", "FormatException"].includes(scanError.name)) {
          scannerControls.stop(); stop();
          setError(t("Okuma durdu. Kamerayı tekrar açın veya görsel yükleyin.", "Scanning stopped. Reopen the camera or upload an image."));
          return;
        }
        if (!result || found || run !== generation.current) return;
        found = true;
        scannerControls.stop();
        deliver(result.getText());
      });
      if (run !== generation.current) scanner.stop();
      else { controls.current = scanner; setLoading(false); }
    } catch (cause) {
      if (run !== generation.current) return;
      stop();
      const name = cause instanceof Error ? cause.name : "";
      setError(name === "NotAllowedError"
        ? t("Kamera izni verilmedi. Adres çubuğundan izin verin veya USB/görsel kullanın.", "Camera permission was denied. Allow it in the address bar or use USB/image input.")
        : name === "NotFoundError"
          ? t("Kamera bulunamadı. USB okuyucu veya görsel yükleme kullanın.", "No camera found. Use a USB reader or image upload.")
          : t("Kamera açılamadı. Başka uygulamada açıksa kapatıp tekrar deneyin.", "Could not open the camera. Close other apps using it and retry."));
    }
  }

  async function readImage(file?: File) {
    if (!file) return;
    stop();
    setError("");
    if (!/^(image\/png|image\/jpeg|image\/webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
      setError(t("En fazla 5 MB PNG, JPG veya WebP seçin.", "Choose a PNG, JPG or WebP up to 5 MB."));
      return;
    }
    const run = generation.current;
    const url = URL.createObjectURL(file);
    setLoading(true);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (run !== generation.current) return;
      if (image.naturalWidth * image.naturalHeight > 12_000_000) throw new Error("ImageTooLarge");
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("CanvasUnavailable");
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const reader = await createReader();
      if (run !== generation.current) return;
      deliver(reader.decodeFromCanvas(canvas).getText());
    } catch (cause) {
      if (run === generation.current) setError(cause instanceof Error && cause.message === "ImageTooLarge"
        ? t("Görsel en fazla 12 megapiksel olmalı. Kodu kırpıp yeniden yükleyin.", "Images must be at most 12 megapixels. Crop the code and retry.")
        : t("Görselde kod bulunamadı. Kodu yakın, net ve düz çekin.", "No code found in the image. Use a clear, close, straight photo."));
    } finally {
      URL.revokeObjectURL(url);
      if (run === generation.current) setLoading(false);
    }
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="mb-2 flex items-center gap-2 text-xs font-medium"><Keyboard className="size-4" />{t("USB okuyucu / kod / SKU", "USB reader / code / SKU")}</label>
        <Input id={id} value={value} maxLength={200} autoComplete="off" spellCheck={false} disabled={disabled || loading || camera}
          placeholder={t("Bu alana tıklayıp okutun; Enter'a basın", "Focus here, scan, then press Enter")}
          onChange={event => setValue(event.target.value)}
          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (!disabled && !loading && !camera) deliver(value); } }} />
      </div>
      <Button type="button" disabled={disabled || loading || camera || !value.trim()} onClick={() => deliver(value)}>{t("Kodu kullan", "Use code")}</Button>
    </div>
    <div className="flex flex-wrap gap-2">
      {!camera ? <Button type="button" variant="secondary" disabled={disabled || loading} onClick={start}><Camera className="size-4" />{t("Kamerayı aç", "Open camera")}</Button>
        : <Button type="button" variant="secondary" onClick={stop}><Square className="size-4" />{t("Kamerayı kapat", "Stop camera")}</Button>}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm">
        <ImageUp className="size-4" />{t("Görselden oku", "Read image")}
        <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" disabled={disabled || loading || camera}
          onChange={event => { void readImage(event.target.files?.[0]); event.target.value = ""; }} />
      </label>
    </div>
    <div hidden={!camera} className="overflow-hidden rounded-xl bg-black">
      <video ref={video} muted playsInline className="max-h-80 w-full object-contain" aria-label={t("Kod okuma kamerası", "Code scanner camera")} />
      <p className="p-3 text-center text-xs text-white">{t("Kodu kadrajda tutun. İlk eşleşmede kamera kapanır.", "Keep the code in view. The camera stops after the first match.")}</p>
    </div>
    {loading && <p role="status" className="text-sm text-muted">{t("Hazırlanıyor…", "Preparing…")}</p>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <p className="text-xs leading-5 text-muted">{t("QR, EAN/UPC, Code 128/39, ITF ve Data Matrix. Görseller cihazınızda işlenir.", "QR, EAN/UPC, Code 128/39, ITF and Data Matrix. Images are processed on your device.")}</p>
  </div>;
}
