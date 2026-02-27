import { NextRequest, NextResponse } from "next/server";
import { buscarRelatorioResumo } from "@/services/api";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const data = await buscarRelatorioResumo(id);
        // console.log(data)
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Falha ao buscar resumo do leilão" }, { status: 500 });
    }
}
