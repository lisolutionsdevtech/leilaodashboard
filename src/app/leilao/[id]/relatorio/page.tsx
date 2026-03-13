"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useState } from "react";
import { LeilaoResumo, LotesResponse } from "@/types/leilao";
import { formatarData } from "@/utils/leilao";
import { Printer, Share2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RelatorioLotesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const { data: leilao, error: errorLeilao } = useSWR<LeilaoResumo>(
    id ? `/api/leiloes/${id}` : null,
    fetcher
  );

  const { data: lotesData, error: errorLotes, isLoading: isLoadingLotes } = useSWR<LotesResponse>(
    id ? `/api/leiloes/${id}/lotes` : null,
    fetcher
  );

  const [isGenerating, setIsGenerating] = useState(false);

  const formatBRL = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num || 0);
  };

  const getModalidade = (tipo?: number) => {
    switch (tipo) {
      case 1: return "Presencial";
      case 4: return "Online";
      default: return "Online e Presencial";
    }
  };

  const proxyImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("/api/image-proxy") || url.startsWith("data:") || url.startsWith("/")) return url;
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const getLeilaoImageUrl = (leilao: LeilaoResumo) => {
    if (leilao.comitentes?.[0]?.image?.thumb) return leilao.comitentes[0].image.thumb;
    if (leilao.comitentes?.[0]?.image?.full) return leilao.comitentes[0].image.full;
    if (leilao.image?.thumb?.url) return leilao.image.thumb.url;
    if (leilao.image?.full?.url) return leilao.image.full.url;
    return "";
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!leilao || !lotesData) return;
    
    try {
      setIsGenerating(true);
      const reportElement = document.getElementById("report-content");
      if (!reportElement) return;

      const toolbar = document.getElementById("report-toolbar");
      if (toolbar) toolbar.style.display = "none";

      const canvas = await html2canvas(reportElement, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      if (toolbar) toolbar.style.display = "flex";

      const imgData = canvas.toDataURL("image/jpeg", 0.90);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `lotes-${leilao.id}.pdf`;
      const blob = pdf.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });

      // 4. Verificar suporte ao compartilhamento
      const canShare = navigator.canShare && navigator.canShare({ files: [file] });

      if (canShare) {
        await navigator.share({
          files: [file],
          title: `Relatório de Lotes`,
        });
      } else {
        // Fallback: Download direto
        pdf.save(fileName);
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      alert("Erro ao gerar PDF para compartilhamento.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (errorLeilao || errorLotes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-xl font-bold text-destructive">Erro ao carregar relatório</h1>
        <p className="text-muted-foreground mt-2">Não foi possível buscar os dados do leilão.</p>
        <Button onClick={() => router.back()} className="mt-4" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>
    );
  }

  if (!leilao || isLoadingLotes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  const lotes = lotesData?.result || [];

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white pb-20 print:pb-0 overflow-x-auto overflow-y-auto">
      {/* Toolbar - Oculta na impressão */}
      <div 
        id="report-toolbar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-white/90 backdrop-blur-md rounded-full border shadow-2xl print:hidden animate-in slide-in-from-bottom-10 whitespace-nowrap"
      >
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full h-10 w-10 p-0 text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Button onClick={handlePrint} variant="outline" className="rounded-full gap-2 border-slate-300">
          <Printer className="h-4 w-4" />
          <span>Imprimir</span>
        </Button>
        <Button onClick={handleShare} disabled={isGenerating} className="rounded-full gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          <span>{isGenerating ? "Gerando..." : "Compartilhar"}</span>
        </Button>
      </div>

      {/* Fixed Layout Container for A4 Feel */}
      <div className="min-w-fit flex justify-center p-0 md:p-8 print:p-0">
        <div id="report-content" className="w-[800px] bg-white shadow-xl print:shadow-none min-h-screen p-12 print:p-8">


          {/* Leilao Info Card Integrated with Branding */}
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl flex justify-between items-center relative overflow-hidden shadow-sm">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/50 rounded-full -mr-16 -mt-16" />
            
            <div className="flex gap-8 items-center relative z-10">
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-3 shadow-sm">
                {getLeilaoImageUrl(leilao) ? (
                  <img src={proxyImageUrl(getLeilaoImageUrl(leilao))} alt="Logo Leilão" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-slate-200 font-bold text-4xl">{leilao.titulo?.charAt(0)}</div>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{leilao.titulo}</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Dados detalhados do evento</p>
                </div>
                <div className="flex gap-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Abertura</span>
                    <span className="text-sm font-bold text-slate-700">{formatarData(leilao.dataAbertura)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Modalidade</span>
                    <span className="text-sm font-bold text-slate-700">{getModalidade(leilao.tipo)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Lotes</span>
                    <span className="text-sm font-bold text-slate-700">{lotes.length} unidades</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Branding integrated on the right */}
            <div className="flex flex-col items-end gap-2 relative z-10 border-l border-slate-200 pl-8 ml-4 min-w-[160px]">
              <div className="h-16 flex items-center justify-end">
                <img 
                  src={proxyImageUrl("https://static.suporteleiloes.com.br/leiloespbcombr/arquivos-avulsos/1/6888fb648ac79-6888fb64a86df.jpg")} 
                  alt="Leilões PB" 
                  className="max-h-full w-auto object-contain" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://www.leiloespb.com.br/client/logo.png?v=2";
                  }} 
                />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-medium">www.leiloespb.com.br</p>
              </div>
            </div>
          </div>

          {/* Lotes Table */}
          <div className="mt-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  <th className="py-3 px-2 text-center w-12">Nº</th>
                  <th className="py-3 px-2 w-20">Foto</th>
                  <th className="py-3 px-4">Descrição do Lote</th>
                  <th className="py-3 px-4 text-right">Valores</th>
                  <th className="py-3 px-2 text-center w-16">Com.</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote) => {
                  const imageUrl = lote.image?.thumb?.url || lote.bem?.image?.thumb?.url;
                  const comitenteImg = lote.bem?.comitente?.image?.thumb;
                  const valorLanceAtual = parseFloat(lote.valorLanceAtual || "0");
                  const descricao = lote.siteDescricao || lote.bem?.siteDescricao || "";

                  return (
                    <tr key={lote.id} className="border-b border-slate-100 group even:bg-slate-100 print:even:bg-slate-100">
                      <td className="py-2.5 px-2 text-center align-middle">
                        <span className="text-base font-black text-slate-800">{lote.numero}</span>
                      </td>
                      <td className="py-2.5 px-2 align-middle">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-white border flex items-center justify-center shadow-sm">
                          {imageUrl ? (
                            <img 
                              src={proxyImageUrl(imageUrl)} 
                              alt={String(lote.numero)} 
                              className="w-full h-full object-cover" 
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          ) : (
                            <div className="text-[9px] text-slate-300">Sem foto</div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 align-top">
                        <h3 className="text-[12px] font-bold text-slate-900 leading-tight mb-0.5">{lote.siteTitulo || lote.bem?.siteTitulo}</h3>
                        <div 
                          className="text-[10px] text-slate-500 leading-snug max-w-sm"
                          dangerouslySetInnerHTML={{ __html: (descricao || "").replace(/\n/g, "<br>") }}
                        />
                      </td>
                      <td className="py-2.5 px-4 align-middle text-right">
                        <div className="flex flex-col gap-1.5 py-1">
                          {/* Lance Inicial */}
                          <div className="flex flex-col">
                            <span className="text-[7.5px] uppercase font-bold text-slate-400 leading-none">Lance Inicial</span>
                            <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{formatBRL(lote.valorMinimo)}</span>
                          </div>

                          {/* Separador se houver Lance Atual */}
                          {valorLanceAtual > 0 && <div className="h-px bg-slate-100 w-full" />}

                          {/* Lance Atual (Apenas se houver) */}
                          {valorLanceAtual > 0 && (
                            <div className="flex flex-col">
                              <span className="text-[7.5px] uppercase font-bold text-slate-400 leading-none">Lance Atual</span>
                              <span className="text-[12px] font-black text-emerald-600 whitespace-nowrap">{formatBRL(valorLanceAtual)}</span>
                            </div>
                          )}

                          {/* Separador se houver Avaliação */}
                          {parseFloat(lote.valorAvaliacao || "0") > 0 && <div className="h-px bg-slate-100 w-full" />}

                          {/* Avaliação */}
                          {parseFloat(lote.valorAvaliacao || "0") > 0 && (
                            <div className="flex flex-col">
                              <span className="text-[7.5px] uppercase font-bold text-slate-400 leading-none">Avaliação</span>
                              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{formatBRL(lote.valorAvaliacao)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 align-middle text-center">
                        <div className="w-8 h-8 mx-auto flex items-center justify-center p-1 bg-white rounded border shadow-sm">
                          {comitenteImg ? (
                            <img src={proxyImageUrl(comitenteImg)} alt="C" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-[7px] font-bold text-slate-300">N/A</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>


        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { overflow: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          #report-toolbar { display: none !important; }
          #report-content { margin: 0 !important; width: 100% !important; max-width: none !important; box-shadow: none !important; padding: 0 !important; }
          .min-w-fit { min-width: 0 !important; }
          tr { page-break-inside: avoid !important; }
        }
      `}</style>
    </div>
  );
}
