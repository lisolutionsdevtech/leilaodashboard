import { LeilaoResumo, LoteResumo } from "@/types/leilao";
import { formatarData } from "./leilao";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function formatBRL(val: number | string): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num || 0);
}

function getModalidade(tipo?: number): string {
  switch (tipo) {
    case 1:
      return "Presencial";
    case 4:
      return "Online";
    default:
      return "Online e Presencial";
  }
}

function getLoteImageUrl(lote: LoteResumo): string {
  return (
    lote.image?.thumb?.url ||
    lote.bem?.image?.thumb?.url ||
    ""
  );
}

function getComitenteImageUrl(lote: LoteResumo): string {
  return lote.bem?.comitente?.image?.thumb || "";
}

function getLeilaoImageUrl(leilao: LeilaoResumo): string {
  if (leilao.comitentes?.[0]?.image?.thumb)
    return leilao.comitentes[0].image.thumb;
  if (leilao.comitentes?.[0]?.image?.full)
    return leilao.comitentes[0].image.full;
  if (leilao.image?.thumb?.url) return leilao.image.thumb.url;
  if (leilao.image?.full?.url) return leilao.image.full.url;
  return "";
}

function proxyImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("/api/image-proxy") || url.startsWith("data:") || url.startsWith("/")) return url;
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function getLoteDescricao(lote: LoteResumo): string {
  return lote.siteDescricao || lote.bem?.siteDescricao || "";
}

function buildLoteDescription(lote: LoteResumo, leilao: LeilaoResumo): string {
  const descricao = getLoteDescricao(lote);

  if (descricao) {
    return descricao.replace(/\n/g, "<br>");
  }

  const comitenteName =
    lote.bem?.comitente?.pessoa?.name ||
    leilao.comitentes?.[0]?.pessoa?.name ||
    "";
  const numero = lote.numero;
  const dataAbertura = formatarData(leilao.dataAbertura);

  const lines = [
    comitenteName ? `${comitenteName}` : "",
    `LOTE: ${numero}`,
    dataAbertura !== "-" ? `DATA: ${dataAbertura}` : "",
  ].filter(Boolean);

  return lines.join("<br>");
}

function buildLotesHtml(lotes: LoteResumo[], leilao: LeilaoResumo): string {
  return lotes
    .map((lote) => {
      const imageUrl = getLoteImageUrl(lote);
      const comitenteImg = getComitenteImageUrl(lote);
      const titulo = lote.siteTitulo || lote.bem?.siteTitulo || "Sem título";
      const desc = buildLoteDescription(lote, leilao);
      const valorMinimo = formatBRL(lote.valorMinimo || "0");
      const valorLanceAtual = parseFloat(lote.valorLanceAtual || "0");

      const lancesInfo = valorLanceAtual > 0
        ? `<div class="stats valorAtual"><span>Lance atual: ${formatBRL(valorLanceAtual)}</span></div>`
        : `<div class="stats valorAtual"><span>Lance mínimo: ${valorMinimo}</span></div>`;

      return `
        <tr>
          <td class="font-destaq font-bold text-nowrap" style="width: 40px; min-width: 40px; max-width: 40px; text-align: center; vertical-align: middle;">
            <div class="lote-numero">${lote.numero}</div>
          </td>
          <td style="vertical-align: middle;">
            ${imageUrl ? `<img src="${proxyImageUrl(imageUrl)}" crossorigin="anonymous" width="60" style="border-radius: 4px;" onerror="this.style.display='none'">` : ""}
          </td>
          <td class="leilao-lote-titulo" style="padding-left: 20px; vertical-align: top;">
            <div class="titulo">${titulo}</div>
            <div class="desc">${desc}</div>
          </td>
          <td class="text-nowrap" style="padding: 0px 20px; font-size: 12px; vertical-align: middle; text-align: center;">
            ${lancesInfo}
          </td>
          <td class="img-comitente" style="vertical-align: middle; text-align: center;">
            ${comitenteImg ? `<img src="${proxyImageUrl(comitenteImg)}" crossorigin="anonymous" width="30" onerror="this.style.display='none'">` : ""}
          </td>
        </tr>`;
    })
    .join("");
}

function buildFullHtml(leilao: LeilaoResumo, lotes: LoteResumo[]): string {
  const tituloLeilao = leilao.titulo || leilao.descricaoInterna || "Leilão";
  const leilaoImageUrl = getLeilaoImageUrl(leilao);
  const dataAbertura = formatarData(leilao.dataAbertura || leilao.data1);
  const modalidade = getModalidade(leilao.tipo);
  const totalLotes = lotes.length;

  const lotesHtml = buildLotesHtml(lotes, leilao);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${tituloLeilao} - Leilões PB</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: #333;
      background: #fff;
    }
    .print-page {
      padding: 20px 30px;
      max-width: 100%;
    }
    .page-header table {
      width: 100%;
      border-collapse: collapse;
    }
    .page-header td { vertical-align: middle; }
    .page-header .width-auto { width: auto; }
    .page-header .text-right { text-align: right; }
    .page-header h2 {
      font-size: 18px;
      margin-top: 6px;
      color: #222;
    }
    .leilao-header {
      margin-top: 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px;
      background: #fafafa;
    }
    .leilao-header table {
      width: 100%;
      border-collapse: collapse;
    }
    .leilao-header td { vertical-align: middle; }
    .comitente-logo img {
      border-radius: 6px;
      object-fit: contain;
    }
    .leilao-info .titulo {
      font-weight: bold;
      font-size: 15px;
      color: #111;
    }
    .leilao-info .datas { color: #666; margin-top: 4px; }
    .font-min { font-size: 11px; }
    .text-uppercase { text-transform: uppercase; }
    .text-black-50 { color: #888; }

    .leilao { margin-top: 20px; }
    .leilao table {
      width: 100%;
      border-collapse: collapse;
    }
    .leilao tr {
      border-bottom: 1px solid #eee;
    }
    .leilao td {
      padding: 8px 4px;
      vertical-align: top;
    }
    .lote-numero {
      font-size: 16px;
      font-weight: bold;
      color: #444;
    }
    .leilao-lote-titulo .titulo {
      font-weight: bold;
      font-size: 13px;
      color: #222;
      margin-bottom: 4px;
    }
    .leilao-lote-titulo .desc {
      font-size: 11px;
      color: #555;
      line-height: 1.5;
    }
    .stats { margin-bottom: 2px; }
    .stats span { font-size: 12px; }
    .stats.valorAtual span { font-weight: bold; color: #1a6b1a; }
    .stats.lances span { color: #666; }
    .img-comitente { text-align: center; }
    .img-comitente img {
      border-radius: 4px;
      object-fit: contain;
    }
    .font-destaq { font-size: 16px; }
    .font-bold { font-weight: bold; }
    .text-nowrap { white-space: nowrap; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-page { padding: 10px 20px; }
      .leilao tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="print-page">
  <div class="page-header">
    <table>
      <tbody>
        <tr>
          <td class="width-auto">
            <img src="/client/logo.png" width="120" onerror="this.src='https://www.leiloespb.com.br/client/logo.png?v=2'" crossorigin="anonymous">
          </td>
          <td class="text-right">
            Leilões PB<br>
            www.leiloespb.com.br<br>
            <h2>Leilão: ${tituloLeilao}</h2>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="leilao-header">
    <table>
      <tbody>
        <tr>
          <td style="width: 80px; min-width: 80px; max-width: 80px;">
            <div class="comitente-logo">
              ${leilaoImageUrl ? `<img src="${proxyImageUrl(leilaoImageUrl)}" crossorigin="anonymous" width="60" onerror="this.style.display='none'">` : ""}
            </div>
          </td>
          <td>
            <div class="leilao-info">
              <div class="titulo">${tituloLeilao}</div>
              <div class="datas font-min">
                <div><span>Abertura: </span><span>${dataAbertura}</span></div>
              </div>
              <div class="datas extra text-uppercase text-black-50 font-min">
                <div><span>Modalidade:</span> <span>${modalidade}</span></div>
              </div>
            </div>
          </td>
          <td>${totalLotes} lotes</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="leilao" style="margin-top: 30px;">
    <table>
      <tbody>
        ${lotesHtml}
      </tbody>
    </table>
  </div>
</div>
</body>
</html>`;
}

export async function gerarPdfLotes(
  leilao: LeilaoResumo,
  lotes: LoteResumo[]
): Promise<void> {
  // Render html wrapper inside a div on the page (off-screen)
  const html = buildFullHtml(leilao, lotes);

  const container = document.createElement("div");
  // position hidden but not off-screen as some canvas engines fail with large negative offsets
  container.style.position = "absolute";
  container.style.left = "0";
  container.style.top = "0";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.zIndex = "-1";
  // The print page width should be roughly A4 (794px width for 96 PPI, let's use 800px)
  container.style.width = "800px";
  container.style.background = "white";
  container.innerHTML = html;
  
  document.body.appendChild(container);

  // Wait a moment for images to load with a timeout (e.g. 5 seconds) so it doesn't hang forever
  const images = Array.from(container.querySelectorAll("img"));
  const loadImagesPromise = Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // ignore errors to proceed
      });
    })
  );

  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 5000));
  await Promise.race([loadImagesPromise, timeoutPromise]);

  try {
    // Ensure we are at the top to avoid capture offsets in some browsers
    const oldScrollX = window.scrollX;
    const oldScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // scale 1.5 instead of 2 significantly speeds up canvas rendering for large tables
    const canvas = await html2canvas(container, {
      scale: 1.5, 
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 800,
    });

    window.scrollTo(oldScrollX, oldScrollY);

    const imgData = canvas.toDataURL("image/jpeg", 0.90);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Calculate proportional height based on the canvas dimension
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // We might need multiple pages if the content is taller than A4 page height (297mm)
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

    const unformattedTitle = leilao.titulo || "leilao";
    const fileName = `lotes-${unformattedTitle.replace(/\s+/g, "_").toLowerCase()}.pdf`;

    const blob = pdf.output("blob");

    // Check if Web Share API feature with files is supported (mobile app context)
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: "application/pdf" })] })) {
      try {
        const file = new File([blob], fileName, { type: "application/pdf" });
        await navigator.share({
          files: [file],
          title: `Lotes do Leilão: ${leilao.titulo}`,
          text: "Confira a lista de lotes deste leilão.",
        });
      } catch (err: any) {
        // If the user canceled the share or it failed, fallback to direct download
        if (err.name !== 'AbortError') {
          console.error("Erro ao compartilhar arquivo, abaixando nativamente.", err);
          pdf.save(fileName);
        }
      }
    } else {
      // Direct download fallback for Desktops and unsupported platforms
      pdf.save(fileName);
    }
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Ocorreu um erro ao gerar o PDF. Verifique sua conexão e tente novamente.");
  } finally {
    // Cleanup the offscreen element
    document.body.removeChild(container);
  }
}
