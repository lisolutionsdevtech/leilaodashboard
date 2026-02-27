import { useState } from 'react';

type ProductData = {
    percentualVendido?: number;
    lotesDisponibilizados?: number;
    lotesVendidos?: number;
    condicionais?: number;
    arrecadacao?: string;
    dataTexto?: string;
    siteTexto?: string;
    tituloDireita?: string;
    subtituloDireita?: string;
    logoUrl?: string;
    semDesistentes?: boolean;
};

export function useSharePoster() {
    const [isSharing, setIsSharing] = useState(false);

    const sharePoster = async (data: ProductData) => {
        setIsSharing(true);
        try {
            // 1. Construir URL com parâmetros codificados
            const params = new URLSearchParams({
                pct: String(data.percentualVendido ?? 0),
                disp: String(data.lotesDisponibilizados ?? 0),
                vend: String(data.lotesVendidos ?? 0),
                cond: String(data.condicionais ?? 0),
                arr: data.arrecadacao || '',
                data: data.dataTexto || '',
                site: data.siteTexto || '',
                titulo: data.tituloDireita || '',
                subtitulo: data.subtituloDireita || '',
                semDesistentes: data.semDesistentes ? 'true' : 'false'
            });

            if (data.logoUrl) {
                params.append('logo', data.logoUrl);
            }

            const apiUrl = `/api/og/leilao?${params.toString()}`;

            // 2. Fetch do Blob
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Falha ao gerar imagem no servidor');

            const blob = await response.blob();

            // 3. Criar arquivo para compartilhar
            const file = new File([blob], 'cartaz-leilao.png', { type: 'image/png' });

            // 4. Verificar suporte ao compartilhamento
            const canShare = navigator.canShare && navigator.canShare({ files: [file] });

            if (canShare) {
                await navigator.share({
                    files: [file],
                    title: 'Resultado do Leilão',
                });
            } else {
                // Fallback: Download direto
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `leilao-${data.tituloDireita || 'resultado'}.png`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Erro ao compartilhar cartaz:', error);
            alert('Não foi possível compartilhar o cartaz no momento.');
        } finally {
            setIsSharing(false);
        }
    };

    return { sharePoster, isSharing };
}
