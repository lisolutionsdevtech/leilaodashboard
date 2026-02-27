"use client";

import { LeilaoResumo } from "@/types/leilao";
import { formatarData, pegarImagemCapa } from "@/utils/leilao";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Layers, Eye, Star, CheckSquare } from "lucide-react";
import Image from "next/image";

interface LeilaoCardProps {
  leilao: LeilaoResumo;
  onClick: () => void;
}

export function LeilaoCard({ leilao, onClick }: LeilaoCardProps) {
  const capaUrl = pegarImagemCapa(leilao);
  const titulo = leilao.titulo || leilao.descricaoInterna || "Sem título";
  const proximoLeilao = formatarData(leilao.dataProximoLeilao);
  const statusTexto =
    leilao.statusMessage ||
    (leilao.status !== null ? `Status: ${leilao.status}` : "-");

  const hasDestaqueItem = !!leilao.stats?.lote?.bem?.siteTitulo;

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full bg-card border-border/50 hover:border-primary/50"
      onClick={onClick}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {capaUrl ? (
          <Image
            src={capaUrl}
            alt={titulo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10">
            <Layers className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
          <Badge
            className={`shadow-sm ${leilao.status === 2 && "bg-blue-500"} ${leilao.status === 3 && "bg-green-500"} ${leilao.status === 4 && "bg-violet-800"}
            ${leilao.status === 0 && "bg-gray-500"}
            ${leilao.status === 99 && "bg-red-500"}`}
          >
            {leilao.status === 0 && "Rascunho"}
            {leilao.status === 2 && "Em Loteamento"}
            {leilao.status === 3 && "Aberto pra lance"}
            {leilao.status === 4 && "Em Leilão"}
            {leilao.status === 99 && "Finalizado"}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <Badge
            variant="outline"
            className="text-xs font-mono text-muted-foreground"
          >
            {leilao.codigo || "S/C"}
          </Badge>
        </div>
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 min-h-[3.5rem]">
          {titulo}
        </h3>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex-grow space-y-3">
        {hasDestaqueItem && (
          <p className="text-xs text-muted-foreground line-clamp-1 italic border-l-2 border-amber-400 pl-2">
            {leilao.stats?.lote?.bem?.siteTitulo}
          </p>
        )}

        <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 col-span-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{proximoLeilao}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>{leilao.totalLotes ?? "-"} lotes</span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4" />
            <span>{leilao.habilitados ?? "-"} hab.</span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2">
            <Eye className="h-4 w-4" />
            <span>{leilao.statsVisitas ?? "-"} visitas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
