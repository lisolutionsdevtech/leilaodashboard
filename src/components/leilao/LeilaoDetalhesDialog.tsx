"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LeilaoResumo,
  LeilaoRelatorioResumo,
  LoteResumo,
  LotesResponse,
} from "@/types/leilao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/utils/leilao";
import useSWR from "swr";
import {
  Layers,
  User,
  Gavel,
  Scale,
  AlertCircle,
  FileText,
  Loader2,
  Download,
  Circle,
  Square,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import Image from "next/image";

interface LeilaoDetalhesDialogProps {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: LeilaoResumo; // Para fallback se já tiver os dados
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function LeilaoDetalhesDialog({
  id,
  open,
  onOpenChange,
  initialData,
}: LeilaoDetalhesDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const {
    data: leilao,
    error,
    isLoading,
  } = useSWR<LeilaoResumo>(id ? `/api/leiloes/${id}` : null, fetcher, {
    fallbackData: initialData,
    revalidateOnFocus: false,
  });

  if (!id) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] h-[85vh] md:w-[900px] md:h-[700px] p-0 overflow-hidden flex flex-col">
          <LeilaoDetalhesContent
            leilao={leilao}
            isLoading={isLoading}
            error={error}
            TitleComponent={DialogTitle}
            HeaderComponent={DialogHeader}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-svh max-h-svh p-0 overflow-hidden flex flex-col ">
        <LeilaoDetalhesContent
          leilao={leilao}
          isLoading={isLoading}
          error={error}
          TitleComponent={DrawerTitle}
          HeaderComponent={DrawerHeader}
        />
      </DrawerContent>
    </Drawer>
  );
}

interface LeilaoDetalhesContentProps {
  leilao: LeilaoResumo | undefined;
  isLoading: boolean;
  error: any;
  TitleComponent: React.ComponentType<any>;
  HeaderComponent: React.ComponentType<any>;
}

import { useMemo, useState } from "react";

function LeilaoDetalhesContent({
  leilao,
  isLoading,
  error,
  TitleComponent,
  HeaderComponent,
}: LeilaoDetalhesContentProps) {
  const {
    data: lotesData,
    isLoading: isLoadingLotes,
    error: errorLotes,
    mutate: mutateLotes,
    isValidating: isValidatingLotes,
  } = useSWR<LotesResponse>(
    leilao?.id ? `/api/leiloes/${leilao.id}/lotes` : null,
    fetcher,
  );

  const {
    data: relatorioData,
    error: errorSummary,
    isLoading: isLoadingSummary,
    mutate: mutateSummary,
    isValidating: isValidatingSummary,
  } = useSWR<LeilaoRelatorioResumo>(
    leilao?.id ? `/api/leiloes/${leilao.id}/resumo` : null,
    fetcher,
  );

  const calculatedStats = useMemo(() => {
    if (!lotesData?.result) return null;
    let lotes = lotesData.result;
    lotes = lotes.filter((l) => l.status !== 0);
    const total = lotes.filter((l) => l.status !== 10).length;

    // Definições de status
    const isVendido = (l: LoteResumo) => l.status === 100;
    const isCondicional = (l: LoteResumo) => l.status === 7;
    const isAberto = (l: LoteResumo) => l.status === 1;
    // status para Retirado (comum ser 0 ou 99, mas vou tentar identificar se vier no stats original ou deixar 0)
    const isRetirado = (l: LoteResumo) => l.status === 10;

    const vendidos = lotes.filter(isVendido).length;
    const condicionais = lotes.filter(isCondicional).length;
    const retirados = lotes.filter(isRetirado).length;

    // Regra: "Aberto, Vendido ou Condicional"
    const isTargetStatus = (l: LoteResumo) =>
      isAberto(l) || isVendido(l) || isCondicional(l);

    // Prévia de Vendas: Soma de lances dos lotes alvo
    const totalPreviaVendas = lotes.reduce((acc, l) => {
      if (isTargetStatus(l)) {
        return acc + parseFloat(l.valorLanceAtual || "0");
      }
      return acc;
    }, 0);

    // % Leiloado: Lotes com lance nos status alvo / total
    const lotsWithBidInTarget = lotes.filter((l) => {
      const hasBid = parseFloat(l.valorLanceAtual || "0") > 0;
      return hasBid && isTargetStatus(l);
    }).length;

    const percentLeiloado = total > 0 ? (lotsWithBidInTarget / total) * 100 : 0;

    const comLance = lotes.filter(
      (l) => parseFloat(l.valorLanceAtual || "0") > 0,
    ).length;
    const semLance = total - comLance;

    // Não Vendidos: Total - Vendidos - Condicionais - Retirados (apenas se finalizado?)
    // Seguiremos a lógica de exclusão
    const naoVendidos = total - vendidos - condicionais - retirados;

    return {
      total,
      vendidos,
      condicionais,
      retirados,
      naoVendidos,
      totalPreviaVendas,
      percentLeiloado,
      comLance,
      semLance,
      lotesRaw: lotes,
    };
  }, [lotesData]);

  if (isLoading || isLoadingLotes) {
    return (
      <>
        <HeaderComponent className="p-6 border-b shrink-0 bg-muted/20">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TitleComponent className="text-md md:text-xl font-bold leading-tight"></TitleComponent>
              </div>
            </div>
          </div>
        </HeaderComponent>
        <div className="flex flex-col gap-2 items-center justify-center h-full w-full">
          <Loader2 className="h-12 w-12 text-muted-foreground/20 animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </>
    );
  }
  return (
    <>
      <HeaderComponent className="p-6 border-b shrink-0 bg-muted/20">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TitleComponent className="text-md md:text-xl font-bold leading-tight">
                {leilao?.titulo || leilao?.descricaoInterna || "Carregando..."}
              </TitleComponent>
              {leilao?.statusMessage && (
                <Badge className="text-nowrap">{leilao.statusMessage}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              {leilao?.codigo && `Cód: ${leilao.codigo}`}{" "}
              {leilao?.slug && `• ${leilao.slug}`}
            </div>
          </div>
        </div>
      </HeaderComponent>

      <div className="flex-grow overflow-hidden flex flex-col">
        <div className="flex justify-between items-center gap-2 px-5 py-2">
          {lotesData?.result?.some((l) => l.status === 2) &&
            leilao?.status === 4 && (
              <Badge variant="destructive">
                <Circle
                  className="w-3 h-3 mr-2 animate-pulse duration-1050"
                  fill="currentColor"
                />{" "}
                Lote em Pregão:{" "}
                {lotesData?.result
                  ?.filter((l) => l.status === 2)
                  .map((l) => l.numero)
                  .join(", ")}
              </Badge>
            )}

          {!lotesData?.result?.some((l) => l.status === 2) &&
            leilao?.status === 4 && (
              <Badge variant="destructive">
                <Circle className="w-3 h-3 mr-2" fill="currentColor" />
                Lote em Pregão: Verificando...
              </Badge>
            )}
          <Button
            className="flex gap-2"
            variant="outline"
            size="sm"
            onClick={() => mutateLotes()}
            disabled={isValidatingLotes}
          >
            <Loader2
              className={cn("w-3 h-3", isValidatingLotes && "animate-spin")}
            />
            Recarregar
          </Button>
        </div>
        {isLoading && !leilao ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-10 text-destructive flex-grow">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p>Erro ao carregar detalhes do leilão.</p>
          </div>
        ) : leilao ? (
          <Tabs
            defaultValue="geral"
            className="flex-grow flex flex-col overflow-hidden"
          >
            <div className="px-6 pt-6 shrink-0">
              <TabsList className="mb-4 w-full grid grid-cols-4">
                <TabsTrigger value="geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="lotes">Lotes</TabsTrigger>
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="arte">Resultado</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="resumo"
              className="flex-grow overflow-hidden mt-0 focus-visible:outline-none"
            >
              <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Layers className="h-4 w-4" /> Resumo
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li>Lotes: {leilao.totalLotes ?? "-"}</li>
                        <li>Habilitados: {leilao.habilitados ?? "-"}</li>
                        <li>Visitas: {leilao.statsVisitas ?? "-"}</li>
                        <li>
                          Venda Direta: {leilao.vendaDireta ? "Sim" : "Não"}
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Scale className="h-4 w-4" /> Informações
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li>Lances: {leilao.stats?.lances ?? 0}</li>
                        {calculatedStats && (
                          <>
                            <li>Lotes com lance: {calculatedStats.comLance}</li>
                            <li>
                              Lotes sem foto:{" "}
                              {
                                calculatedStats.lotesRaw.filter(
                                  (lote: LoteResumo) =>
                                    !lote.image?.thumb?.url &&
                                    !lote.bem?.image?.thumb?.url,
                                ).length
                              }
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="lotes"
              className="flex-grow overflow-hidden mt-0 focus-visible:outline-none"
            >
              <ScrollArea className="h-full px-6 pb-6">
                <LotesTabContent
                  lotes={calculatedStats?.lotesRaw || []}
                  stats={calculatedStats}
                  isLoading={isLoadingLotes}
                  error={errorLotes}
                  mutate={mutateLotes}
                  isValidating={isValidatingLotes}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="geral"
              className="flex-grow overflow-hidden mt-0 focus-visible:outline-none"
            >
              <ScrollArea className="h-full px-6 pb-6">
                <ResumoTabContent
                  leilao={leilao}
                  statsCalculated={calculatedStats}
                  isLoadingLotes={isLoadingLotes}
                  relatorioData={relatorioData}
                  isLoadingSummary={isLoadingLotes}
                  errorSummary={errorSummary}
                  mutate={mutateSummary}
                  isValidating={isValidatingSummary}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="arte"
              className="flex-grow overflow-hidden mt-0 focus-visible:outline-none flex flex-col"
            >
              <ScrollArea className="h-full px-2 sm:px-4 md:px-6 pb-6">
                <ArteResultadoTabContent
                  leilao={leilao}
                  statsCalculated={calculatedStats}
                  relatorioData={relatorioData}
                  isLoadingSummary={isLoadingSummary}
                  mutate={mutateSummary}
                  isValidating={isValidatingSummary}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </>
  );
}

function LotesTabContent({
  lotes,
  stats,
  isLoading,
  error,
  mutate,
  isValidating,
}: {
  lotes: LoteResumo[];
  stats: any;
  isLoading: boolean;
  error: any;
  mutate: () => void;
  isValidating: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex gap-4 p-4 border rounded-lg animate-pulse"
          >
            <div className="w-20 h-20 bg-muted rounded" />
            <div className="flex-grow space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-destructive">
        <AlertCircle className="h-10 w-10 mx-auto mb-2" />
        <p>Erro ao carregar lotes do leilão.</p>
      </div>
    );
  }

  if (lotes.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Nenhum lote encontrado para este leilão.</p>
      </div>
    );
  }

  const formatBRL = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num || 0);
  };

  const [lotesSemLance, setLotesSemLance] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-center">
          <p className="text-[10px] uppercase text-blue-700 font-semibold">
            Com Lance
          </p>
          <p className="text-xl font-bold text-blue-700">
            {stats?.comLance || 0}
          </p>
        </div>
        <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 text-center">
          <p className="text-[10px] uppercase text-orange-700 font-semibold">
            Sem Lance
          </p>
          <p className="text-xl font-bold text-orange-700">
            {stats?.semLance || 0}
          </p>
        </div>
        <div className="bg-green-50/50 p-3 rounded-lg border border-green-100 text-center">
          <p className="text-[10px] uppercase text-green-700 font-semibold">
            Vendidos
          </p>
          <div className="flex justify-center gap-2 text-xl font-bold text-green-700">
            <span>{stats?.vendidos || 0}</span>
          </div>
        </div>
        <div className="bg-violet-50/50 p-3 rounded-lg border border-violet-100 text-center">
          <p className="text-[10px] uppercase text-violet-700 font-semibold">
            Condicional
          </p>
          <div className="flex justify-center gap-2 text-xl font-bold text-violet-700">
            <span>{stats?.condicionais || 0}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b pb-2">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-wrap">
          Lista de Lotes |
          <Badge className="ml-2 font-mono">{stats.total + stats.retirados} Itens</Badge>
          <Badge
            onClick={() => setLotesSemLance(!lotesSemLance)}
            className={`ml-2 border-[1px] font-mono ${lotesSemLance ? "bg-yellow-700 hover:bg-yellow-600 text-yellow-100" : "hover:bg-yellow-200 bg-yellow-100 text-yellow-700"} hover:cursor-pointer`}
          >
            {stats.semLance} Sem lance
          </Badge>
        </span>
      </div>

      <div className="grid gap-4">
        {lotesSemLance && (
          <Badge className="w-max">Exibindo apenas lotes sem lance</Badge>
        )}
        {lotesSemLance
          ? lotes
            .filter((lote) => !lote.lanceAtual)
            .map((lote) => (
              <div
                key={lote.id}
                className={`flex gap-4 p-4 border rounded-lg hover:bg-muted transition-colors hover:cursor-pointer ${lote.status === 10 && "bg-red-100 hover:bg-red-200"} `}
              >
                <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {lote.image?.thumb?.url || lote.bem?.image?.thumb?.url ? (
                    <Image
                      src={
                        lote.image?.thumb?.url ||
                        lote.bem?.image?.thumb?.url ||
                        ""
                      }
                      alt={lote.siteTitulo || lote.bem?.siteTitulo || ""}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                    LOTE {lote.numero}
                  </div>
                </div>
                <div className="flex-grow min-w-0 space-y-1">
                  <h4 className="font-bold text-sm line-clamp-2">
                    {lote.siteTitulo || lote.bem?.siteTitulo}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {lote.bem?.comitente?.pessoa?.name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />{" "}
                        {lote.bem.comitente.pessoa.name}
                      </span>
                    )}
                  </div>
                  <div className="pt-2 flex justify-between items-end">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase text-muted-foreground font-medium">
                          Lance Atual
                        </p>
                        <p className="font-bold text-primary">
                          {lote.valorLanceAtual
                            ? formatBRL(lote.valorLanceAtual)
                            : "Sem Lance"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        {lote.valorAvaliacao !== "0.00" && (
                          <>
                            <p className="text-[10px] uppercase text-muted-foreground font-medium">
                              Avaliação
                            </p>
                            <p className="font-bold text-primary">
                              {formatBRL(lote.valorAvaliacao || "0")}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {lote.status === 100 && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 hover:bg-green-100"
                      >
                        Vendido
                      </Badge>
                    )}
                    {lote.status === 2 && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-violet-700 hover:bg-gray-100"
                      >
                        Em Pregão
                      </Badge>
                    )}
                    {lote.status === 5 && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                      >
                        Homologando
                      </Badge>
                    )}
                    {lote.status === 7 && (
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700 hover:bg-purple-100"
                      >
                        Condicional
                      </Badge>
                    )}
                    {lote.status === 1 && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                      >
                        Aberto
                      </Badge>
                    )}
                    {lote.status === 10 && (
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-700 hover:bg-red-100"
                      >
                        Retirado
                      </Badge>
                    )}
                    {lote.status === 8 && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                      >
                        Sem Licitante
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          : lotes.map((lote) => (
            <div
              key={lote.id}
              className={`flex gap-4 p-4 border rounded-lg hover:bg-muted transition-colors hover:cursor-pointer ${lote.status === 10 && "bg-red-100 hover:bg-red-200"} `}
            >
              <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-md bg-muted">
                {lote.image?.thumb?.url || lote.bem?.image?.thumb?.url ? (
                  <Image
                    src={
                      lote.image?.thumb?.url ||
                      lote.bem?.image?.thumb?.url ||
                      ""
                    }
                    alt={lote.siteTitulo || lote.bem?.siteTitulo || ""}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                  LOTE {lote.numero}
                </div>
              </div>
              <div className="flex-grow min-w-0 space-y-1">
                <h4 className="font-bold text-sm line-clamp-2">
                  {lote.siteTitulo || lote.bem?.siteTitulo}
                </h4>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {lote.bem?.comitente?.pessoa?.name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />{" "}
                      {lote.bem.comitente.pessoa.name}
                    </span>
                  )}
                </div>
                <div className="pt-2 flex justify-between items-end">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase text-muted-foreground font-medium">
                        Lance Atual
                      </p>
                      <p className="font-bold text-primary">
                        {lote.valorLanceAtual
                          ? formatBRL(lote.valorLanceAtual)
                          : "Sem Lance"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      {lote.valorAvaliacao !== "0.00" && (
                        <>
                          <p className="text-[10px] uppercase text-muted-foreground font-medium">
                            Avaliação
                          </p>
                          <p className="font-bold text-primary">
                            {formatBRL(lote.valorAvaliacao || "0")}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {lote.status === 100 && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 hover:bg-green-100"
                    >
                      Vendido
                    </Badge>
                  )}
                  {lote.status === 2 && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-violet-700 hover:bg-gray-100"
                    >
                      Em Pregão
                    </Badge>
                  )}
                  {lote.status === 5 && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                    >
                      Homologando
                    </Badge>
                  )}
                  {lote.status === 7 && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-700 hover:bg-purple-100"
                    >
                      Condicional
                    </Badge>
                  )}
                  {lote.status === 1 && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                    >
                      Aberto
                    </Badge>
                  )}
                  {lote.status === 10 && (
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 hover:bg-red-100"
                    >
                      Retirado
                    </Badge>
                  )}
                  {lote.status === 8 && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                    >
                      Sem Licitante
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { pegarLogoComitente } from "@/utils/leilao";

const CartazLeilaoResumo = dynamic(() => import("./CartazLeilaoResumo"), {
  ssr: false,
  loading: () => <div className="p-4 w-full h-full flex items-center justify-center"><Skeleton className="h-[400px] w-full max-w-[560px] mx-auto rounded-3xl" /></div>,
});

function ResumoTabContent({
  leilao,
  statsCalculated,
  isLoadingLotes,
  relatorioData,
  isLoadingSummary,
  errorSummary,
  mutate,
  isValidating,
}: {
  leilao: LeilaoResumo;
  statsCalculated: any;
  isLoadingLotes: boolean;
  relatorioData: LeilaoRelatorioResumo | undefined;
  isLoadingSummary: boolean;
  errorSummary: any;
  mutate: () => void;
  isValidating: boolean;
}) {
  if (isLoadingSummary || isLoadingLotes)
    return (
      <div className="p-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );

  if (errorSummary && !statsCalculated)
    return <div className="p-4 text-destructive">Erro ao carregar resumo.</div>;

  const statsAPI = relatorioData?.data?.stats;
  const stats = statsCalculated;

  const formatBRL = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num || 0);
  };

  if (!stats)
    return (
      <div className="p-4 text-muted-foreground">
        Sem dados de lotes disponíveis.
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-center">
          <p className="text-[10px] uppercase text-blue-700 font-semibold">
            Com Lance
          </p>
          <p className="text-xl font-bold text-blue-700">
            {stats?.comLance || 0}
          </p>
        </div>
        <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 text-center">
          <p className="text-[10px] uppercase text-orange-700 font-semibold">
            Sem Lance
          </p>
          <p className="text-xl font-bold text-orange-700">
            {stats?.semLance || 0}
          </p>
        </div>
        <div className="bg-green-50/50 p-3 rounded-lg border border-green-100 text-center">
          <p className="text-[10px] uppercase text-green-700 font-semibold">
            Vendidos
          </p>
          <div className="flex justify-center gap-2 text-xl font-bold text-green-700">
            <span>{stats?.vendidos || 0}</span>
          </div>
        </div>
        <div className="bg-violet-50/50 p-3 rounded-lg border border-violet-100 text-center">
          <p className="text-[10px] uppercase text-violet-700 font-semibold">
            Condicional
          </p>
          <div className="flex justify-center gap-2 text-xl font-bold text-violet-700">
            <span>{stats?.condicionais || 0}</span>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            <tr className="bg-muted/30">
              <td className="p-3 font-medium">% Leiloado</td>
              <td className="p-3 text-right">
                {Math.round(stats.percentLeiloado)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            <tr className="bg-muted/30">
              <td className="p-3 font-medium">Lotes com Lance</td>
              <td className="p-3 text-right">{stats.comLance || 0}</td>
            </tr>
            <tr>
              <td className="p-3 font-medium">{leilao.status !== 99 ? "Arrecadação (Prévia)" : "Arrecadação (Vendidos)"}</td>
              <td className="p-3 text-right font-bold">
                {formatBRL(stats.totalPreviaVendas)}
              </td>
            </tr>
            {statsAPI && (
              <>
                <tr>
                  <td className="p-3">Comissão</td>
                  <td className="p-3 text-right">
                    {formatBRL(statsAPI.totalComissao)}
                  </td>
                </tr>
                <tr>
                  <td className="p-3">Taxas Administrativas</td>
                  <td className="p-3 text-right">
                    {formatBRL(statsAPI.totalTaxas)}
                  </td>
                </tr>
                <tr className="bg-green-50 font-bold text-green-800">
                  <td className="p-3">Vendidos + Comissão + Taxas</td>
                  <td className="p-3 text-right">
                    {formatBRL(statsAPI.valorTotalAReceber)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            <tr className="bg-muted/30">
              <td className="p-3 font-medium">Lotes</td>
              <td className="p-3 text-right">Total: {stats.total + stats.retirados}</td>
            </tr>
            <tr>
              <td className="p-3 font-medium">Disponíveis</td>
              <td className="p-3 text-right font-bold">{stats.total}</td>
            </tr>
            {stats.retirados > 0 && (
              <tr className="bg-red-50 border border-red-200">
                <td className="p-3">Retirados</td>
                <td className="p-3 text-right">{stats.retirados}</td>
              </tr>
            )}
            {stats.comLance !== stats.vendidos && (
              <tr className="bg-blue-50 border border-blue-200">
                <td className="p-3">Abertos Com lance</td>
                <td className="p-3 text-right">
                  {stats.comLance - stats.vendidos - stats.condicionais}
                </td>
              </tr>
            )}
            <tr className="bg-green-50 border border-green-200">
              <td className="p-3">Vendidos</td>
              <td className="p-3 text-right">{stats.vendidos}</td>
            </tr>
            <tr className="bg-purple-100 border border-purple-200">
              <td className="p-3">Condicionais</td>
              <td className="p-3 text-right">{stats.condicionais}</td>
            </tr>
            <tr className="bg-yellow-50 border border-yellow-200">
              <td className="p-3">Não Vendidos</td>
              <td className="p-3 text-right">{stats.total - stats.comLance}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArteResultadoTabContent({
  leilao,
  statsCalculated,
  relatorioData,
  isLoadingSummary,
  mutate,
  isValidating,
}: {
  leilao: LeilaoResumo;
  statsCalculated: any;
  relatorioData: LeilaoRelatorioResumo | undefined;
  isLoadingSummary: boolean;
  mutate: () => void;
  isValidating: boolean;
}) {
  if (isLoadingSummary || !statsCalculated)
    return (
      <div className="p-4">
        <Skeleton className="h-[400px] w-full max-w-[560px] mx-auto rounded-3xl" />
      </div>
    );

  if (!relatorioData && !statsCalculated)
    return <div className="p-4 text-destructive">Erro ao carregar arte.</div>;

  const [semDesistentes, setSemDesistentes] = useState(false);

  const stats = statsCalculated;
  const formatBRL = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num || 0);
  };

  const dataLeilao = leilao.dataProximoLeilao?.date
    ? new Date(leilao.dataProximoLeilao.date)
    : new Date();
  const dataTexto = `DIA ${format(dataLeilao, "d 'DE' MMMM yyyy", { locale: ptBR }).toUpperCase()}`;
  const diaSemanaTexto = `(${format(dataLeilao, "cccc", { locale: ptBR }).toUpperCase()})`;

  const comitentePrincipal = leilao.comitentes?.[0];

  // Nomes brutos vindos da API
  const relatorioNome =
    comitentePrincipal?.pessoa?.name ||
    comitentePrincipal?.apelido ||
    "LEILÕES PB";

  // Dicionário para você ajustar nomes manualmente conforme sua necessidade
  const correcoesNomes: Record<string, string> = {
    "MAPFRE REMOCOES ESPECIAIS": "MAPFRE SEGUROS",
    // Adicione outros aqui no formato "NOME QUE VEM ERRADO": "NOME CORRETO"
  };

  const subtituloDireita = correcoesNomes[relatorioNome] || relatorioNome;
  const logoUrl =
    pegarLogoComitente(leilao, statsCalculated?.lotesRaw) || undefined;
  const fundoUrl = leilao.image?.full?.url || undefined;

  return (
    // Reduzimos o gap (space-y-2), o padding (pt-2 pb-4) e mudamos justify-center para justify-start
    <div className="flex-1 flex flex-col items-center justify-start space-y-2 pt-2 pb-4 h-full min-h-0 ">

      {/* Opções de customização da Arte */}
      <div className="w-full flex justify-end px-4 mb-2">
        <Button
          className="flex gap-2"
          variant="outline"
          size="sm"
          onClick={() => setSemDesistentes(!semDesistentes)}
        >
          {semDesistentes ? (
            <CheckSquare className="w-4 h-4 text-[#dfb555]" />
          ) : (
            <Square className="w-4 h-4 text-muted-foreground" />
          )}
          Sem Desistentes
        </Button>
      </div>

      {/* O container do cartaz agora pode crescer e ocupar o resto do espaço */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <CartazLeilaoResumo
          percentualVendido={Math.round(stats.percentLeiloado)}
          lotesDisponibilizados={stats.total}
          lotesVendidos={stats.vendidos}
          condicionais={stats.condicionais}
          arrecadacao={formatBRL(stats.totalPreviaVendas)}
          dataTexto={dataTexto}
          diaSemanaTexto={diaSemanaTexto}
          siteTexto="www.leiloespb.com.br"
          tituloDireita="LEILOADO"
          subtituloDireita={subtituloDireita?.toUpperCase()}
          fundoUrl={fundoUrl}
          logoUrl={logoUrl}
          semDesistentes={semDesistentes}
        />
      </div>
    </div>
  );
}
