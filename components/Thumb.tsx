"use client";

import { css } from "@/lib/css";
import { initials, primeiraFoto, thumbStyle } from "@/lib/helpers";
import type { Produto } from "@/lib/types";

/**
 * Product thumbnail: shows the real first photo when the product has one
 * saved (from the wizard or the edit screen), falling back to the
 * gradient-color placeholder with brand initials otherwise.
 */
export default function Thumb({
  p,
  size = 40,
  radius = 11,
}: {
  p: Pick<Produto, "fotos" | "hue" | "marca">;
  size?: number;
  radius?: number;
}) {
  const foto = primeiraFoto(p);
  if (foto) {
    return (
      <img
        src={foto}
        alt={p.marca}
        style={css(`width:${size}px;height:${size}px;flex:none;border-radius:${radius}px;object-fit:cover`)}
      />
    );
  }
  return <span style={css(thumbStyle(p, size))}>{initials(p)}</span>;
}
