import type { Metadata } from "next";
import "./globals.css";
import "@/components/map/leaflet.css";
import { I18nProvider } from "@/lib/i18n/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: "OportunIA - Radar de Clientes de Alto Valor",
  description:
    "Encuentra, califica y propone a clientes ideales para servicios de AI. Hecho para Inland Empire y SoCal.",
  authors: [{ name: "OportunIA" }],
  keywords: [
    "AI services",
    "lead generation",
    "B2B sales",
    "Inland Empire",
    "SoCal",
    "scoring",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* FOUC prevention & Chrome Extension Error Shield (Bitdefender / Anti-trackers) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('oportunia-theme');var h=document.documentElement;if(t==='light'){h.classList.remove('dark');h.classList.add('light');}else{h.classList.add('dark');}var l=localStorage.getItem('oportunia-locale');h.lang=(l==='en')?'en':'es';if(typeof window!=='undefined'){var isExt=function(msg,src,stk){var str=((msg||'')+' '+(src||'')+' '+(stk||'')).toLowerCase();return str.indexOf('chrome-extension://')!==-1||str.indexOf('moz-extension://')!==-1||str.indexOf('safari-extension://')!==-1||str.indexOf('eppiocemhmnlbhjplcgkofciiegomcon')!==-1||str.indexOf('m_id')!==-1||str.indexOf('bis_')!==-1||str.indexOf('cz-shortcut')!==-1;};window.addEventListener('error',function(e){var msg=e.message||'';var src=e.filename||'';var stk=(e.error&&e.error.stack)||'';if(isExt(msg,src,stk)){e.preventDefault();e.stopImmediatePropagation();return true;}},true);window.addEventListener('unhandledrejection',function(e){var r=String(e.reason||'');var stk=(e.reason&&e.reason.stack)||'';if(isExt(r,'',stk)){e.preventDefault();e.stopImmediatePropagation();return true;}},true);var origOnErr=window.onerror;window.onerror=function(msg,url,line,col,err){var stk=(err&&err.stack)||'';if(isExt(msg,url,stk))return true;if(origOnErr)return origOnErr.apply(window,arguments);return false;};var origErr=console.error;console.error=function(){for(var i=0;i<arguments.length;i++){var a=arguments[i];var s=(typeof a==='string')?a:(a&&(a.message||a.stack))||'';if(isExt(s,'',''))return;}return origErr.apply(console,arguments);};if(typeof MutationObserver!=='undefined'){var extObs=new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];if(m.type==='attributes'&&m.attributeName&&(m.attributeName.indexOf('bis_')===0||m.attributeName==='cz-shortcut-listen')){m.target.removeAttribute(m.attributeName);}}});extObs.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked','bis_register','cz-shortcut-listen']});}}}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        {/* Google Fonts: Inter (UI) + Outfit (display) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <I18nProvider>
          <DashboardShell>{children}</DashboardShell>
        </I18nProvider>
      </body>
    </html>
  );
}
