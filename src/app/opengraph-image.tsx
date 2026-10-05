import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share image. Replace with a design featuring the official logo when available. */
export default function OpengraphImage() {
  const beads = ["#FF4F9A", "#FFC93C", "#36C5F0", "#7B5CFF", "#2ED3A2", "#FF8A3D"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #FFE3F0 0%, #FFF4D1 50%, #DDF4FF 100%)",
          fontFamily: "sans-serif",
          color: "#2A1E3B",
        }}
      >
        <div style={{ display: "flex", gap: 14, marginBottom: 36 }}>
          {beads.concat(beads).map((c, i) => (
            <div key={i} style={{ width: 44, height: 44, borderRadius: 44, background: c }} />
          ))}
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>{siteConfig.name}</div>
        <div style={{ fontSize: 44, marginTop: 16, color: "#D6246E", fontWeight: 700 }}>{siteConfig.tagline}</div>
        <div style={{ fontSize: 30, marginTop: 28, color: "#6B5E7B" }}>Handmade bracelets, personalised accessories &amp; gifts</div>
        <div style={{ fontSize: 28, marginTop: 40, fontWeight: 700 }}>hifivebyjia.in ✋</div>
      </div>
    ),
    size,
  );
}
