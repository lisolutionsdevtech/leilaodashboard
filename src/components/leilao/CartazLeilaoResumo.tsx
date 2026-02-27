import React, { useRef, useState, useEffect } from "react";
import { Share2, Loader2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSharePoster } from "@/hooks/useSharePoster";

type Props = {
  className?: string;
  percentualVendido?: number;
  lotesDisponibilizados?: number;
  lotesVendidos?: number;
  condicionais?: number;
  arrecadacao?: string;
  dataTexto?: string;
  diaSemanaTexto?: string;
  siteTexto?: string;
  tituloDireita?: string;
  subtituloDireita?: string;
  fundoUrl?: string;
  logoUrl?: string;
  semDesistentes?: boolean;
};

function DonutPercentual({
  percentual,
  tamanho = 260,
  espessura = 24,
  isExport = false,
}: {
  percentual: number;
  tamanho?: number;
  espessura?: number;
  isExport?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, percentual));
  const raio = (tamanho - espessura) / 2;
  const circ = 2 * Math.PI * raio;
  const dash = (pct / 100) * circ;
  const gap = circ - dash;

  return (
    <div className="relative flex justify-center items-center w-full aspect-square">
      <svg
        viewBox={`0 0 ${tamanho} ${tamanho}`}
        className={`w-full h-full ${!isExport ? "drop-shadow-[0_0_30px_rgba(202,138,4,0.2)]" : ""}`}
      >
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={espessura}
        />
        <g transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}>
          <circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            fill="none"
            stroke="url(#premiumGoldGradient)"
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            className={!isExport ? "transition-all duration-300 ease-out" : ""}
          />
          <defs>
            <linearGradient id="premiumGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>
        </g>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-['Bodoni_Moda']">
        <div className="flex items-baseline">
          <span className="text-[60px] font-black text-white leading-none italic"
            style={{ textShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>
            {pct}
          </span>
          <span className="text-[45px] font-black text-[#dfb555] ml-[10px] italic">%</span>
        </div>
      </div>
    </div>
  );
}

function LogoImage({ src, fallbackChar, onLoad }: { src: string; fallbackChar: string, onLoad?: () => void }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-[120px] h-[120px] rounded-2xl bg-gradient-to-br from-[#dfb555] to-[#a6802e] flex items-center justify-center font-bold text-black uppercase text-[32px] shrink-0">
        {fallbackChar}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt="Comitente"
      crossOrigin="anonymous" // Fundamental para exportar Canvas sem erros de CORS
      onLoad={onLoad}
      className="w-[120px] h-[120px] rounded-2xl object-contain shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function CartazContent({
  props,
  className,
  isExport = false,
}: {
  props: Props;
  className?: string;
  isExport?: boolean;
}) {
  const percentualVendido = props.percentualVendido ?? 78;
  const lotesDisponibilizados = props.lotesDisponibilizados ?? 628;
  const lotesVendidos = props.lotesVendidos ?? 0;
  const condicionais = props.condicionais ?? 0;
  const arrecadacao = props.arrecadacao ?? "R$ 2.110.500,00";
  const dataTexto = props.dataTexto ?? "26 DE FEVEREIRO 2026";
  const siteTexto = props.siteTexto ?? "LEILOESPB.COM.BR";
  const tituloDireita = props.tituloDireita ?? "LEILOADO";
  const subtituloDireita = props.subtituloDireita ?? "TOKIO MARINE SEGURADORA";

  // Logo sempre precisa de proxy pois é URL externa (CORS) para renderização local
  const proxyLogoUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("/api/image-proxy") || url.startsWith("data:") || url.startsWith("/")) return url;
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const logoUrl = proxyLogoUrl(props.logoUrl);

  return (
    <div
      className={[
        "relative w-[720px] h-[982px] overflow-hidden bg-gradient-to-br from-[#2c2c2d] via-[#1a1a1b] to-[#0e0e0e] text-white font-['Jost']",
        className,
      ].join(" ")}
      style={{
        width: "720px",
        height: "982px"
      }}
    >
      {/* Header: Data a esquerda + Badge do comitente a direita */}
      <div className="absolute top-[40px] left-0 right-[40px] z-10 flex items-start justify-between gap-[16px]">
        {/* Data do leilao */}
        <div className="flex flex-col shrink-0">
          <div className="flex items-center">
            <div className="w-[12px] h-[48px] bg-[#dfb555] mr-[24px] shadow-[4px_0_20px_rgba(223,181,85,0.4)]"></div>
            <h1 className="text-[28px] font-['Bodoni_Moda'] font-black text-[#dfb555] tracking-tight italic uppercase leading-tight"
              style={{ textShadow: isExport ? "none" : "0 4px 10px rgba(0,0,0,0.5)" }}>
              {dataTexto}
            </h1>
          </div>
          <p className="text-gray-300 ml-[36px] mt-[4px] text-[12px] tracking-[0.3em] font-bold uppercase">
            {siteTexto}
          </p>
        </div>

        <div className={`flex items-center justify-center shrink-0`}>
          {logoUrl ? (
            <LogoImage src={logoUrl} fallbackChar={subtituloDireita?.charAt(0) || "?"} />
          ) : (
            <div className="w-[120px] h-[120px] rounded-2xl bg-gradient-to-br from-[#dfb555] to-[#a6802e] flex items-center justify-center font-bold text-black uppercase text-[32px] shrink-0">
              {subtituloDireita?.charAt(0)}
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-[100px] bottom-[340px] left-0 right-0 flex flex-col items-center justify-center z-10 pointer-events-none px-[48px]">
        <div className="relative w-full flex items-center justify-center">
          <div className="w-[260px] h-[260px] flex items-center justify-center">
            <DonutPercentual percentual={percentualVendido} isExport={isExport} />
          </div>
        </div>
        <h2
          className="text-[60px] font-['Bodoni_Moda'] font-black text-[#dfb555] mt-[70px] tracking-tighter italic leading-none uppercase shrink-0"
          style={{ textShadow: "0 5px 20px rgba(0,0,0,0.8)" }}>
          {tituloDireita}
        </h2>
        <span className="text-gray-300 text-[16px] tracking-[0.3em] font-bold uppercase mt-[8px] font-['Jost']">
          {subtituloDireita}
        </span>
      </div>

      <div className="absolute bottom-[128px] left-[40px] right-[40px] flex flex-col gap-[20px] z-10">
        <LinhaMetricaDashboard label="LOTES DISPONIBILIZADOS" valor={String(lotesDisponibilizados)} />
        <LinhaMetricaDashboard label="LOTES VENDIDOS" valor={String(lotesVendidos)} />
        {condicionais > 0 && (
          <LinhaMetricaDashboard label="LOTES CONDICIONAIS" valor={String(condicionais)} />
        )}
        <LinhaMetricaDashboard label="ARRECADAÇÃO" valor={arrecadacao} />
      </div>

      {props.semDesistentes && (
        <div
          className="absolute bottom-[40px] left-[40px] z-20 flex items-stretch border border-[#dfb555]/50 rounded-sm overflow-hidden bg-black/60 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          <div className="bg-gradient-to-br from-[#ca8a04] via-[#fef3c7] to-[#a6802e] px-[16px] py-[12px] flex items-center justify-center">
            <svg className="w-[22px] h-[22px] text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="px-[16px] py-[10px] flex flex-col justify-center">
            <span className="font-['Bodoni_Moda'] italic text-[#dfb555] text-[20px] font-black leading-none">
              Sem Desistentes
            </span>
            <span className="font-['Jost'] text-[9.5px] text-white/60 tracking-[0.2em] font-bold uppercase mt-[4px] leading-none">
              100% de Aproveitamento
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-[40px] right-[40px] z-10 flex items-center gap-[20px]">
        <img
          src={'/icons/icon-512x512.png'}
          alt="Leilões PB"
          className="w-[56px] h-[56px] rounded-[12px] object-contain"
        />
        <div className="flex flex-col items-start justify-center">
          <span className="text-[#dfb555] font-black text-[30px] leading-none tracking-[0.1em] font-['Bodoni_Moda'] italic uppercase"
            style={{ textShadow: isExport ? "none" : "0 4px 15px rgba(0,0,0,0.6)" }}>
            LEILÕES PB
          </span>
          <span className="text-gray-400 text-[10px] tracking-[0.4em] font-black mt-[8px] uppercase font-['Jost']">
            Casa de Leilões
          </span>
        </div>
      </div>
    </div>
  );
}

function LinhaMetricaDashboard({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-baseline text-[20px] font-black text-white w-full tracking-wider font-['Jost']">
      <span className="flex-shrink-0 uppercase opacity-90">{label}</span>
      <div className="flex-grow border-b-[3px] border-dotted border-white/20 mx-[16px] mb-[8px] h-0"></div>
      <span className="text-[#dfb555] text-[28px] font-black whitespace-nowrap">{valor}</span>
    </div>
  );
}

export default function CartazLeilaoResumo(props: Props) {
  const { sharePoster, isSharing } = useSharePoster();
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      const TARGET_WIDTH = 720;
      const TARGET_HEIGHT = 982;
      const PADDING = 32;

      if (width === 0 || height === 0) return;

      const scaleX = (width - PADDING) / TARGET_WIDTH;
      const scaleY = (height - PADDING) / TARGET_HEIGHT;
      const finalScale = Math.min(scaleX, scaleY);
      setScale(finalScale > 0 ? finalScale : 0.1);
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleShare = () => {
    sharePoster(props);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[400px]">

      {/* Versão Interativa na Tela */}
      <div ref={containerRef} className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        <div
          className="relative shrink-0"
          style={{ width: 720 * scale, height: 982 * scale }}
        >
          <div
            style={{
              width: "720px",
              height: "982px",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="absolute top-0 left-0 shadow-2xl rounded-3xl border border-white/5 overflow-hidden"
          >
            <CartazContent props={props} />
          </div>
        </div>

        {/* Botão de Compartilhamento */}
        <div className="absolute bottom-4 left-4 z-20 group/btn">
          <Button
            onClick={handleShare}
            disabled={isSharing}
            size="icon"
            className="h-14 w-14 rounded-3xl bg-white/10 hover:bg-[#ca8a04] backdrop-blur-md text-white shadow-xl transition-all duration-300 border border-white/20"
          >
            {isSharing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Share2 className="h-6 w-6 text-[#ca8a04] group-hover/btn:text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
