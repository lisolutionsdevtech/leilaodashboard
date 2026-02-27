export async function obterToken(): Promise<string> {
    // Em produção, idealmente faríamos cache deste token
    // Mas para o escopo atual, faremos a requisição a cada chamada de página ou usaremos SWR/React Cache se fosse server component puro

    const baseUrl = process.env.API_BASE_URL;
    const username = process.env.API_USER;
    const password = process.env.API_PASS;

    if (!baseUrl || !username || !password) {
        console.warn("Credenciais de API não configuradas corretamente.");
        return "";
    }

    try {
        const params = new URLSearchParams();
        params.append('user', username);
        params.append('pass', password);

        const res = await fetch(`${baseUrl}/api/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "Origin": "https://erp.leiloespb.com.br",
                "Referer": "https://erp.leiloespb.com.br/"
            },
            body: params,
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`Falha ao obter token: ${res.status}`);
        }

        const data = await res.json();
        // console.log("[Auth] Login response keys:", Object.keys(data));
        const fs = require('fs');
        try { fs.appendFileSync('debug.log', `[${new Date().toISOString()}] [Auth] Response Keys: ${Object.keys(data).join(',')}\n`); } catch (e) { }

        // Assumindo que retorna { token: "..." } ou { access_token: "..." }
        const token = data.token || data.access_token || data.accessToken;

        if (!token) {
            // console.error("[Auth] Token not found in response:", data);
            try { fs.appendFileSync('debug.log', `[${new Date().toISOString()}] [Auth] Token NOT FOUND. Data: ${JSON.stringify(data)}\n`); } catch (e) { }
        } else {
            // console.log("[Auth] Token received successfully.");
            try { fs.appendFileSync('debug.log', `[${new Date().toISOString()}] [Auth] Token received (length: ${token.length})\n`); } catch (e) { }
        }

        return `Bearer ${token}`;
    } catch (error) {
        console.error("Erro na autenticação:", error);
        const fs = require('fs');
        try { fs.appendFileSync('debug.log', `[${new Date().toISOString()}] [Auth] Exception: ${error}\n`); } catch (e) { }
        return "";
    }
}
