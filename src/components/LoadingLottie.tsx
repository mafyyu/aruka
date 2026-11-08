"use client";

import { Lottie } from "lottie-react";
import styles from "./LoadingLottie.module.css";

const LOTTIE_SRC = "/lottie/aruka-loading.json";

type LoadingLottieProps = {
  size?: number;
  speed?: number;
};

export function LoadingLottie({
  size = 150,
  speed = 1.75,
}: LoadingLottieProps) {
  return (
    <div className={styles.overlay} aria-busy="true" aria-label="読み込み中">
      <Lottie
        className={styles.lottie}
        src={LOTTIE_SRC}
        loop
        autoplay
        speed={speed}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
