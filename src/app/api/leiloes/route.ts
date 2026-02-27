import { NextResponse } from "next/server";
import { buscarLeiloesAbertos } from "@/services/api";

export const dynamic = 'force-dynamic'; // Sempre buscar dados frescos

export async function GET() {
    try {
        const data = await buscarLeiloesAbertos();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Falha ao buscar leilões" }, { status: 500 });
    }
}
