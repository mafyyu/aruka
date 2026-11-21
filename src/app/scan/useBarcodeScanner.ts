"use client";

import { BrowserMultiFormatOneDReader } from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from "@zxing/library";
import { useEffect, useRef, useState } from "react";

type Options = {
  /** true のあいだカメラでバーコードを読み取る */
  enabled: boolean;
  /** ISBN（978/979 始まり）を読み取ったとき */
  onDetect: (isbn: string) => void;
};

export function useBarcodeScanner({ enabled, onDetect }: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatOneDReader | null>(null);
  const mountedRef = useRef(true);
  const onDetectRef = useRef(onDetect);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    if (!enabled || !videoRef.current) return;

    mountedRef.current = true;
    let stream: MediaStream | null = null;

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 360 },
        aspectRatio: { ideal: 2 / 1 },
      },
    };

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);

    const codeReader = new BrowserMultiFormatOneDReader(hints);
    readerRef.current = codeReader;

    codeReader.decodeFromConstraints(
      constraints,
      videoRef.current,
      (result, error, controls) => {
        if (!stream && videoRef.current?.srcObject instanceof MediaStream) {
          stream = videoRef.current.srcObject;
        }
        if (mountedRef.current === false) {
          controls.stop();
          return;
        }
        if (result) {
          const text = result.getText();
          if (text.startsWith("978") || text.startsWith("979")) {
            controls.stop();
            onDetectRef.current(text);
          }
          return;
        }
        if (error && !(error instanceof NotFoundException)) {
          console.log("error", error);
        }
      },
    );

    return () => {
      mountedRef.current = false;
    };
  }, [enabled]);

  return {
    videoRef,
    cameraReady,
    setCameraReady,
  };
}
