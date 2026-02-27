import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ApiDate, LeilaoResumo } from "@/types/leilao";

export function formatarData(apiDate?: ApiDate): string {
    if (!apiDate?.date) return "-";
    try {
        // A data da API vem geralmente como "YYYY-MM-DD HH:mm:ss.000000"
        const date = parseISO(apiDate.date);
        return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
        return apiDate.date;
    }
}

export function pegarImagemCapa(leilao: LeilaoResumo): string | null {
    // Prioridade: min > thumb > full do leilao.image
    if (leilao.image?.min?.url) return leilao.image.min.url;
    if (leilao.image?.thumb?.url) return leilao.image.thumb.url;
    if (leilao.image?.full?.url) return leilao.image.full.url;

    // Fallback: stats.lote.bem.image
    const bemImage = leilao.stats?.lote?.bem?.image;
    if (bemImage?.min?.url) return bemImage.min.url;
    if (bemImage?.thumb?.url) return bemImage.thumb.url;
    if (bemImage?.full?.url) return bemImage.full.url;

    return null;
}

export function pegarLogoComitente(leilao: LeilaoResumo, lotesRaw?: any[]): string | null {
    // 1. Comitente principal do leilão
    const comitente = leilao.comitentes?.[0];
    if (comitente?.image?.thumb) return comitente.image.thumb;
    if (comitente?.image?.full) return comitente.image.full;

    // 2. Stats do leilão (stats.lote.bem.comitente)
    const statsComitente = (leilao as any).stats?.lote?.bem?.comitente?.image;
    if (statsComitente?.thumb) return statsComitente.thumb;
    if (statsComitente?.full) return statsComitente.full;

    // 3. Fallback: buscar logo do comitente nos lotes
    if (lotesRaw) {
        for (const lote of lotesRaw) {
            // Caminho: lote.bem.comitente.image
            const img = lote.bem?.comitente?.image;
            if (img?.thumb) return img.thumb;
            if (img?.full) return img.full;
            // Caminho alternativo: lote.comitente.image
            const img2 = lote.comitente?.image;
            if (img2?.thumb) return img2.thumb;
            if (img2?.full) return img2.full;
        }
    }

    return null;
}
