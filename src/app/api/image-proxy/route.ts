import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing URL parameter", { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`External response status: ${response.status}`);

        const blob = await response.blob();
        const headers = new Headers();
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Content-Type", response.headers.get("Content-Type") || "image/jpeg");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Error proxying image:", error);
        return new NextResponse("Failed to fetch image", { status: 500 });
    }
}
