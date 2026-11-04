"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./CloseHeader.module.css";

type CloseHeaderProps = {
  href: string;
};

export default function CloseHeader({ href }: CloseHeaderProps) {
  return (
    <Link href={href} className={styles.close} aria-label="閉じる">
      <Image
        className={styles.icon}
        src="/close.svg"
        alt=""
        width={32}
        height={32}
      />
    </Link>
  );
}
