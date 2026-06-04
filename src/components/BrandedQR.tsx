"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  url: string;
  businessName: string;
  size?: number;
}

export function BrandedQR({ url, businessName, size = 480 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 40;
    const qrSize = size - padding * 2;
    const footerHeight = 120;
    canvas.width = size;
    canvas.height = size + footerHeight;

    ctx.fillStyle = "#fdf8f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render QR onto an offscreen canvas, then composite onto ours so
    // we can paint the business name + tagline below it.
    const tmp = document.createElement("canvas");
    QRCode.toCanvas(tmp, url, {
      width: qrSize,
      margin: 0,
      color: { dark: "#1a2744", light: "#fdf8f0" },
      errorCorrectionLevel: "H",
    }).then(() => {
      ctx.drawImage(tmp, padding, padding, qrSize, qrSize);

      ctx.fillStyle = "#1a2744";
      ctx.font = "bold 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(businessName, size / 2, size + 40, size - padding * 2);

      ctx.fillStyle = "#6c6357";
      ctx.font = "18px Georgia, serif";
      ctx.fillText("sealtheday.com", size / 2, size + 80);
    });
  }, [url, businessName, size]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-sealtheday-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="max-w-full rounded-lg border border-cream-dark shadow-sm" />
      <button
        onClick={download}
        className="rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-cream hover:bg-navy/90"
      >
        Download PNG
      </button>
    </div>
  );
}
