import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share image featuring the official logo (unaltered, scaled). */
export default async function OpengraphImage() {
  const logo = siteConfig.logo
    ? `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public", siteConfig.logo.src))).toString("base64")}`
    : null;
  const beads = ["#ED0C68", "#FAAF04", "#01BDC6", "#7721C2"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 72px",
          background: "linear-gradient(135deg, #FFE1EE 0%, #FFF3D6 50%, #DBF6F7 100%)",
          fontFamily: "sans-serif",
          color: "#3B1F4C",
        }}
      >
        {logo && (
          <div style={{ display: "flex", width: 470, height: 470, borderRadius: 48, background: "#FFFFFF", padding: 8, boxShadow: "0 20px 50px rgba(59,31,76,0.18)" }}>
            <img src={logo} width={454} height={454} alt="" />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            {beads.concat(beads).map((c, i) => (
              <div key={i} style={{ width: 34, height: 34, borderRadius: 34, background: c }} />
            ))}
          </div>
          <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.1, color: "#D10A5C" }}>Made with Creativity.</div>
          <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.1, marginTop: 6 }}>Shared with a Smile.</div>
          <div style={{ fontSize: 28, marginTop: 28, color: "#6E5A7E" }}>Handmade bracelets, personalised accessories &amp; gifts</div>
          <div style={{ fontSize: 30, marginTop: 36, fontWeight: 700 }}>hifivebyjia.in</div>
        </div>
      </div>
    ),
    size,
  );
}
