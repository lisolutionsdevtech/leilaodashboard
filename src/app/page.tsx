"use client";

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { LeilaoResumo } from '@/types/leilao';
import { LeilaoCard } from '@/components/leilao/LeilaoCard';
import { LeilaoDetalhesDialog } from '@/components/leilao/LeilaoDetalhesDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import TabsContent needed?
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardPage() {
  const { data, error, mutate, isLoading } = useSWR<{ result: LeilaoResumo[] }>(
    '/api/leiloes',
    fetcher,
    { revalidateOnFocus: false }
  );

  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'result' | 'finalizados'>('result');

  // Fetch on demand para finalizados
  const { data: dataFinalizados, isLoading: isLoadingFinalizados } = useSWR<{ result: LeilaoResumo[] }>(
    abaAtiva === 'finalizados' ? '/api/leiloes/finalizados' : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const [leilaoSelecionadoId, setLeilaoSelecionadoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentLoading = abaAtiva === 'finalizados' ? isLoadingFinalizados : isLoading;
  const currentError = abaAtiva === 'finalizados' ? null : error; // Error handling for finalizados handled separately or could be unified

  // Filtragem client-side
  const leiloesFiltrados = useMemo(() => {
    if (!data) return [];

    // Lista base depedendo da aba
    let lista: LeilaoResumo[] = [];
    if (abaAtiva === 'result') lista = data?.result || [];
    else if (abaAtiva === 'finalizados') lista = dataFinalizados?.result || [];

    if (!busca.trim()) return lista;

    const termo = busca.toLowerCase();
    return lista.filter(leilao => {
      return (
        leilao.titulo?.toLowerCase().includes(termo) ||
        leilao.descricaoInterna?.toLowerCase().includes(termo) ||
        leilao.codigo?.toLowerCase().includes(termo) ||
        leilao.slug?.toLowerCase().includes(termo) ||
        leilao.comitentes?.some(c => c.pessoa?.name?.toLowerCase().includes(termo) || c.apelido?.toLowerCase().includes(termo))
      );
    });
  }, [data, dataFinalizados, abaAtiva, busca]);

  const handleRefresh = () => {
    mutate();
  };

  const handleCardClick = (id: number) => {
    setLeilaoSelecionadoId(id);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b bg-muted/20 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold tracking-tight">Leilões Abertos</h1>
            <p className="text-sm text-muted-foreground">Lista de leilões e acesso rápido aos detalhes</p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                name="search"
                placeholder="Buscar por título, código..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => handleRefresh()} disabled={currentLoading}>
              <RefreshCw className={`h-4 w-4 ${currentLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Tabs value={abaAtiva} onValueChange={(v) => setAbaAtiva(v as any)} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-[600px]">
            <TabsTrigger value="result">
              Abertos
              {data?.result && <span className="ml-2 text-xs bg-primary/10 px-1.5 rounded-full">{data.result.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="finalizados">
              Finalizados
            </TabsTrigger>
          </TabsList>

          <div className="min-h-[200px]">
            {currentLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
                ))}
              </div>
            ) : currentError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                  Não foi possível carregar os leilões. Por favor, tente novamente.
                </AlertDescription>
              </Alert>
            ) : leiloesFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Nenhum leilão encontrado</h3>
                  <p className="text-muted-foreground">Tente ajustar seus filtros de busca.</p>
                </div>
                <Button variant="outline" onClick={() => setBusca('')}>Limpar busca</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {leiloesFiltrados.map((leilao) => (
                  <LeilaoCard
                    key={leilao.id}
                    leilao={leilao}
                    onClick={() => handleCardClick(leilao.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </main>

      <LeilaoDetalhesDialog
        id={leilaoSelecionadoId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        // Opcional: passar dados iniciais do resumo para o dialog mostrar algo enquanto carrega o detalhe
        initialData={leiloesFiltrados.find(l => l.id === leilaoSelecionadoId)}
      />
    </div >
  );
}
