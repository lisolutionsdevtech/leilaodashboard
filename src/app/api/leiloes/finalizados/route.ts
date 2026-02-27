import { NextResponse } from "next/server";
import { buscarLeiloesFinalizados } from "@/services/api";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await buscarLeiloesFinalizados();
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Falha ao buscar leilões finalizados" }, { status: 500 });
    }
}
