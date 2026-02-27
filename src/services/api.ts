import {
  LeilaoResponse,
  LeilaoResumo,
  LeilaoRelatorioResumo,
  LotesResponse,
} from "@/types/leilao";
import { obterToken } from "./auth";

const BASE_URL = process.env.API_BASE_URL;

export async function buscarLeiloesAbertos(): Promise<LeilaoResponse> {
  const token = await obterToken();
  const params = new URLSearchParams({
    page: "1",
    limit: "20",
    sortBy: "dataProximoLeilao",
    descending: "false",
    search: "",
    status: "0,1,2,3,4",
  });

  const fullUrl = `${BASE_URL}/api/leiloes?${params.toString()}`;
  // console.log(`[API] Fetching: ${fullUrl}`);
  const fs = require("fs");
  try {
    fs.appendFileSync(
      "debug.log",
      `[${new Date().toISOString()}] [API] Fetching: ${fullUrl}\n`,
    );
  } catch (e) { }

  const res = await fetch(fullUrl, {
    headers: {
      Accept: "application/json",
      Authorization: token,
      Origin: "https://erp.leiloespb.com.br",
      Referer: "https://erp.leiloespb.com.br/",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    // console.error(`[API] Error config:`, { status: res.status, url: fullUrl });
    const text = await res.text();
    // console.error(`[API] Error body:`, text);
    try {
      fs.appendFileSync(
        "debug.log",
        `[${new Date().toISOString()}] [API] Error Status: ${res.status}\n`,
      );
      fs.appendFileSync(
        "debug.log",
        `[${new Date().toISOString()}] [API] Error Body: ${text}\n`,
      );
    } catch (e) { }
    throw new Error(
      `Erro ao buscar leilões: ${res.status} - ${text.substring(0, 100)}`,
    );
  }

  return res.json();
}

export async function buscarLeilaoPorId(id: number): Promise<LeilaoResumo> {
  // Nota: Esta função será chamada pelo Client Component via Route Handler ou Server Action
  // Ou se for Server Component direto.
  // O prompt pede "Dialog faz fetch sob demanda", o que implica Client Side Fetching ou Server Action.
  // Vou deixar pronto para ser usado.

  const token = await obterToken();
  const res = await fetch(`${BASE_URL}/api/leiloes/${id}`, {
    headers: {
      Accept: "application/json",
      Authorization: token,
      Origin: "https://erp.leiloespb.com.br",
      Referer: "https://erp.leiloespb.com.br/",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar detalhe do leilão ${id}: ${res.status}`);
  }

  return res.json();
}

export async function buscarRelatorioResumo(
  id: number,
): Promise<LeilaoRelatorioResumo> {
  const token = await obterToken();
  const res = await fetch(`${BASE_URL}/api/leiloes/${id}/relatorios/resumo`, {
    headers: {
      Accept: "application/json",
      Authorization: token,
      Origin: "https://erp.leiloespb.com.br",
      Referer: "https://erp.leiloespb.com.br/",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar resumo do leilão ${id}: ${res.status}`);
  }

  return res.json();
}

export async function buscarLeiloesFinalizados(): Promise<LeilaoResponse> {
  const token = await obterToken();
  const params = new URLSearchParams({
    page: "1",
    limit: "20",
    sortBy: "dataProximoLeilao",
    descending: "true",
    search: "",
    status: "96,97,98,99",
  });

  const res = await fetch(`${BASE_URL}/api/leiloes?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      Authorization: token,
      Origin: "https://erp.leiloespb.com.br",
      Referer: "https://erp.leiloespb.com.br/",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar leilões finalizados: ${res.status}`);
  }

  return res.json();
}
export async function buscarLotesPorLeilao(id: number): Promise<LotesResponse> {
  const token = await obterToken();
  const limit = 200;
  let page = 1;
  let allLots: any[] = [];
  let stats: any = null;

  while (true) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: "numero",
      descending: "false",
      search: "",
      stats: "1",
    });

    const res = await fetch(
      `${BASE_URL}/api/leiloes/${id}/lotes?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: token,
          Origin: "https://erp.leiloespb.com.br",
          Referer: "https://erp.leiloespb.com.br/",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error(
        `Erro ao buscar lotes do leilão ${id} (página ${page}): ${res.status}`,
      );
    }

    const data = await res.json();
    allLots = [...allLots, ...data.result];
    stats = data.stats;

    if (!data.result || data.result.length < limit) {
      break;
    }
    page++;
  }

  return {
    result: allLots,
    total: allLots.length,
    stats: stats,
  };
}
