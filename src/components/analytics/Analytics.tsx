import Script from "next/script";
import { siteConfig } from "@/config/site";

/**
 * Loads Google Analytics 4 and/or Meta Pixel only when their IDs are set via
 * environment variables. With no IDs configured nothing is loaded.
 */
export function Analytics() {
  const { googleAnalyticsId: ga, metaPixelId: pixel } = siteConfig.analytics;
  const safe = (id: string) => /^[A-Za-z0-9-]+$/.test(id);

  return (
    <>
      {ga && safe(ga) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {pixel && safe(pixel) && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
