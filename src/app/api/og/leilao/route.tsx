import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Função para buscar fontes do Google Fonts dinamicamente
async function loadGoogleFont(font: string, weight: number, italic: boolean = false) {
  const url = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:ital,wght@${italic ? 1 : 0},${weight}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.ok) {
      return await response.arrayBuffer();
    }
  }
  throw new Error(`Failed to load font: ${font}`);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parâmetros do Leilão
    const pct = searchParams.get('pct') || '78';
    const lotesDisp = searchParams.get('disp') || '628';
    const lotesVend = searchParams.get('vend') || '490';
    const condicionais = searchParams.get('cond') || '0';
    const arrecadacao = searchParams.get('arr') || 'R$ 2.110.500,00';
    const dataTexto = searchParams.get('data') || '26 DE FEVEREIRO 2026';
    const siteTexto = searchParams.get('site') || 'LEILOESPB.COM.BR';
    const titulo = searchParams.get('titulo') || 'LEILOADO';
    const subtitulo = searchParams.get('subtitulo') || 'TOKIO MARINE SEGURADORA';
    const logoUrl = searchParams.get('logo');
    const semDesistentes = searchParams.get('semDesistentes') === 'true';

    // Carregar Fontes e Logos em paralelo
    const origin = req.nextUrl.origin;
    const [bodoniBlackItalic, jostRegular, jostBold, jostBlack, footerLogoBuffer, comitenteLogoBuffer] = await Promise.all([
      loadGoogleFont('Bodoni Moda', 900, true),
      loadGoogleFont('Jost', 400),
      loadGoogleFont('Jost', 700),
      loadGoogleFont('Jost', 900),
      fetch(`${origin}/icons/icon-512x512.png`).then(res => res.arrayBuffer()).catch(() => null),
      logoUrl ? fetch(logoUrl).then(res => res.arrayBuffer()).catch(() => null) : Promise.resolve(null)
    ]);

    // Converter buffers para base64 para o Satori
    const footerLogoBase64 = footerLogoBuffer
      ? `data:image/png;base64,${Buffer.from(footerLogoBuffer).toString('base64')}`
      : null;

    const comitenteLogoBase64 = comitenteLogoBuffer
      ? `data:image/png;base64,${Buffer.from(comitenteLogoBuffer).toString('base64')}`
      : null;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0e0e0e',
            backgroundImage: 'linear-gradient(to bottom right, #2c2c2d, #1a1a1b, #0e0e0e)',
            color: 'white',
            fontFamily: 'Jost',
            position: 'relative',
            padding: '40px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '48px', backgroundColor: '#dfb555', marginRight: '24px' }} />
                <h1 style={{
                  fontSize: '28px',
                  fontFamily: 'Bodoni Moda',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  color: '#dfb555',
                  textTransform: 'uppercase',
                  margin: 0
                }}>
                  {dataTexto}
                </h1>
              </div>
              <p style={{ color: '#d1d5db', marginLeft: '36px', marginTop: '4px', fontSize: '12px', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase' }}>
                {siteTexto}
              </p>
            </div>

            {/* Logo placeholder or image - Cantos levemente arredondados (12px) */}
            <div style={{
              display: 'flex',
              width: '120px',
              height: '120px',
              borderRadius: '12px',
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: comitenteLogoBase64 ? 'transparent' : 'rgba(223,181,85,0.1)',
              border: comitenteLogoBase64 ? 'none' : '2px solid #dfb555'
            }}>
              {comitenteLogoBase64 ? (
                <img src={comitenteLogoBase64} width="120" height="120" style={{ objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '48px', fontWeight: 900, color: '#dfb555' }}>
                  {subtitulo.charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: '20px' }}>
            {/* Donut Chart (Simplified SVG for Satori) */}
            <div style={{ position: 'relative', display: 'flex', width: '260px', height: '260px', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="260" height="260" viewBox="0 0 260 260">
                <circle cx="130" cy="130" r="118" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="24" />
                <circle
                  cx="130"
                  cy="130"
                  r="118"
                  fill="none"
                  stroke="#ca8a04"
                  strokeWidth="24"
                  strokeDasharray={`${(Number(pct) / 100) * 2 * Math.PI * 118} ${2 * Math.PI * 118}`}
                  strokeLinecap="round"
                  transform="rotate(-90 130 130)"
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', alignItems: 'baseline', fontFamily: 'Bodoni Moda', fontStyle: 'italic' }}>
                <span style={{ fontSize: '60px', fontWeight: 900 }}>{pct}</span>
                <span style={{ fontSize: '45px', fontWeight: 900, color: '#dfb555', marginLeft: '10px' }}>%</span>
              </div>
            </div>

            <h2 style={{
              fontSize: '60px',
              fontFamily: 'Bodoni Moda',
              fontWeight: 900,
              fontStyle: 'italic',
              color: '#dfb555',
              marginTop: '70px',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: 1
            }}>
              {titulo}
            </h2>
            <span style={{ color: '#d1d5db', fontSize: '16px', letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>
              {subtitulo}
            </span>
          </div>

          {/* Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '88px' }}>
            {[
              { label: 'LOTES DISPONIBILIZADOS', val: lotesDisp },
              { label: 'LOTES VENDIDOS', val: lotesVend },
              ...(Number(condicionais) > 0 ? [{ label: 'LOTES CONDICIONAIS', val: condicionais }] : []),
              { label: 'ARRECADAÇÃO', val: arrecadacao },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', width: '100%', fontSize: '20px', fontWeight: 900 }}>
                <span style={{ whiteSpace: 'nowrap', opacity: 0.9 }}>{item.label}</span>
                <div style={{ flexGrow: 1, borderBottom: '3px dashed rgba(255,255,255,0.2)', margin: '0 16px', height: '14px' }} />
                <span style={{ color: '#dfb555', fontSize: '28px', whiteSpace: 'nowrap' }}>{item.val}</span>
              </div>
            ))}
          </div>

          {/* Selo Sem Desistentes */}
          {semDesistentes && (
            <div style={{
              position: 'absolute',
              bottom: '40px',
              left: '40px',
              display: 'flex',
              alignItems: 'stretch',
              border: '1px solid rgba(223, 181, 85, 0.5)',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                backgroundImage: 'linear-gradient(to bottom right, #ca8a04, #fef3c7, #a6802e)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="#000000" style={{ display: 'block' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div style={{
                padding: '10px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.6)',
              }}>
                <span style={{
                  fontFamily: 'Bodoni Moda',
                  fontStyle: 'italic',
                  color: '#dfb555',
                  fontSize: '20px',
                  fontWeight: 900,
                  lineHeight: 1,
                }}>
                  Sem Desistentes
                </span>
                <span style={{
                  fontFamily: 'Jost',
                  fontSize: '9.5px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: '0.2em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  marginTop: '4px',
                  lineHeight: 1,
                }}>
                  100% de Aproveitamento
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: '40px', right: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', width: '56px', height: '56px', borderRadius: '12px', justifyContent: 'center', alignItems: 'center' }}>
              {footerLogoBase64 ? (
                <img src={footerLogoBase64} width="56" height="56" style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                color: '#dfb555',
                fontSize: '30px',
                fontWeight: 900,
                fontFamily: 'Bodoni Moda',
                fontStyle: 'italic',
                textTransform: 'uppercase'
              }}>
                LEILÕES PB
              </span>
              <span style={{ color: '#9ca3af', fontSize: '10px', letterSpacing: '0.4em', fontWeight: 900, textTransform: 'uppercase', marginTop: '4px' }}>
                Casa de Leilões
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 720,
        height: 982,
        fonts: [
          {
            name: 'Bodoni Moda',
            data: bodoniBlackItalic,
            weight: 900,
            style: 'italic',
          },
          {
            name: 'Jost',
            data: jostRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Jost',
            data: jostBold,
            weight: 700,
            style: 'normal',
          },
          {
            name: 'Jost',
            data: jostBlack,
            weight: 900,
            style: 'normal',
          },
        ],
      }
    );
  } catch (e: any) {
    console.error(e.message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
