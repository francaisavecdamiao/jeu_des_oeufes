/* =========================================================
   JEU DES OEUFS — app.js
   Utilitários compartilhados entre host e participante.
   ========================================================= */

const OVOS_INICIAIS = 50;

/* ---------------------------------------------------------
   TEXTO
   --------------------------------------------------------- */
function esc(s){
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function jsStr(s){ return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

function formatScore(n){
  return Math.round(Number(n)||0).toLocaleString('pt-BR');
}

/* ---------------------------------------------------------
   SONS (pasta sounds/ — se o arquivo não existir, fica mudo)
   --------------------------------------------------------- */
const SOUND_FILES = {
  click:'sounds/click.mp3',
  ok:'sounds/ok.mp3',
  falha:'sounds/falha.mp3',
  level:'sounds/level.mp3',
  win:'sounds/win01.mp3',
  clicksuave:'sounds/clicksuave.mp3',   // clique nas palavras do texto
  fase:'sounds/fase.mp3',               // passar de parágrafo (fase)
  start:'sounds/start.mp3'              // início do jogo
};
const VOLUME_PADRAO = 0.85;
const SOUND_VOLUMES = { clicksuave: VOLUME_PADRAO * 0.3 };   // 30% do volume padrão
const som = {
  muted:false,
  init(){ try{ this.muted = localStorage.getItem('oeufs_mute') === '1'; }catch(e){} },
  toggle(){
    this.muted = !this.muted;
    try{ localStorage.setItem('oeufs_mute', this.muted ? '1' : '0'); }catch(e){}
    return this.muted;
  },
  icon(){ return this.muted ? '🔇' : '🔊'; }
};
som.init();

function playSound(name){
  if(som.muted) return;
  try{
    const src = SOUND_FILES[name]; if(!src) return;
    const a = new Audio(src);
    a.volume = SOUND_VOLUMES[name] !== undefined ? SOUND_VOLUMES[name] : VOLUME_PADRAO;
    a.play().catch(()=>{});
  }catch(e){}
}

/* ---------------------------------------------------------
   AVATAR DE RESERVA
   --------------------------------------------------------- */
function avatarFallback(nome){
  const letra = (String(nome||'?').trim().charAt(0) || '?').toUpperCase();
  const cores = ['#F2A7AD','#8EC2C9','#F2A444','#F2B28D','#EF7211'];
  let hash = 0;
  for(let i=0;i<String(nome).length;i++) hash = (hash*31 + String(nome).charCodeAt(i)) | 0;
  const cor = cores[Math.abs(hash) % cores.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${cor}"/><text x="50" y="58" font-family="Nunito, sans-serif" font-size="46" font-weight="800" fill="#ffffff" text-anchor="middle">${letra}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* ---------------------------------------------------------
   PERSONAGENS
   --------------------------------------------------------- */
const PERSONAGENS = [
  { nome:'Louise',    retrato:'personagens/LOUISE.jpeg',    galo:'personagens-com-galos/GALO1/LOUISE-GALO1.png' },
  { nome:'Pierre',    retrato:'personagens/PIERRE.jpeg',    galo:'personagens-com-galos/GALO1/PIERRE-GALO1.png' },
  { nome:'Sophie',    retrato:'personagens/SOPHIE.jpeg',    galo:'personagens-com-galos/GALO1/SOPHIE-GALO1.png' },
  { nome:'Rémi',      retrato:'personagens/RÉMI.jpeg',      galo:'personagens-com-galos/GALO1/RÉMI-GALO1.png' },
  { nome:'Cécile',    retrato:'personagens/CÉCILE.jpeg',    galo:'personagens-com-galos/GALO1/CÉCILE-GALO1.png' },
  { nome:'Charlotte', retrato:'personagens/CHARLOTTE.jpeg', galo:'personagens-com-galos/GALO1/CHARLOTTE-GALO1.png' },
  { nome:'Julien',    retrato:'personagens/JULIEN.jpeg',    galo:'personagens-com-galos/GALO1/JULIEN-GALO1.png' },
  { nome:'François',  retrato:'personagens/FRANÇOIS.jpeg',  galo:'personagens-com-galos/GALO1/FRANÇOIS-GALO1.png' },
  { nome:'Gaspard',   retrato:'personagens/GASPARD.jpeg',   galo:'personagens-com-galos/GALO1/GASPARD-GALO1.png' },
  { nome:'Léo',       retrato:'personagens/LÉO.jpeg',       galo:'personagens-com-galos/GALO1/LEO-GALO1.png' },
  { nome:'Adèle',     retrato:'personagens/ADÈLE.jpeg',     galo:'personagens-com-galos/GALO1/ADÈLE-GALO1.png' },
  { nome:'Laurent',   retrato:'personagens/LAURENT.jpeg',   galo:'personagens-com-galos/GALO1/LAURENT-GALO1.png' },
  { nome:'Bastien',   retrato:'personagens/BASTIEN.jpeg',   galo:'personagens-com-galos/GALO1/BASTIEN-GALO1.png' },
  { nome:'Béatrice',  retrato:'personagens/BÉATRICE.jpeg',  galo:'personagens-com-galos/GALO1/BÉATRICE-GALO1.png' },
  { nome:'Élise',     retrato:'personagens/ÉLISE.jpeg',     galo:'personagens-com-galos/GALO1/ÉLISE-GALO1.png' },
  { nome:'Antoine',   retrato:'personagens/ANTOINE.jpeg',   galo:'personagens-com-galos/GALO1/ANTOINE-GALO1.png' },
  { nome:'Julie',     retrato:'personagens/JULIE.jpeg',     galo:'personagens-com-galos/GALO1/JULIE-GALO1.png' },
  { nome:'Marie',     retrato:'personagens/MARIE.jpeg',     galo:'personagens-com-galos/GALO1/MARIE-GALO1.png' },
  { nome:'Florence',  retrato:'personagens/FLORENCE.jpeg',  galo:'personagens-com-galos/GALO1/FLORENCE-GALO1.png' },
  { nome:'Valérie',   retrato:'personagens/VALÉRIE.jpeg',   galo:'personagens-com-galos/GALO1/VALÉRIE-GALO1.png' },
  { nome:'Mathieu',   retrato:'personagens/MATHIEU.jpeg',   galo:'personagens-com-galos/GALO1/MATHIEU-GALO1.png' },
  { nome:'Grégoire',  retrato:'personagens/GREGOIRE.jpeg',  galo:'personagens-com-galos/GALO1/GREGOIRE-GALO1.png' }
];
function charSrc(path){ return encodeURI(path); }
function charByName(nome){ return PERSONAGENS.find(p => p.nome === nome) || PERSONAGENS[0]; }
function retratoDe(nome){ return charSrc(charByName(nome).retrato); }
function galoDe(nome){ return charSrc(charByName(nome).galo); }

/* ---------------------------------------------------------
   PERSISTÊNCIA (localStorage)
   --------------------------------------------------------- */
function saveState(key, obj){ try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){} }
function loadState(key){
  let raw = null;
  try{ raw = localStorage.getItem(key); }catch(e){ return null; }
  if(!raw) return null;
  try{ return JSON.parse(raw); }catch(e){ clearState(key); return null; }
}
function clearState(key){ try{ localStorage.removeItem(key); }catch(e){} }

/* ---------------------------------------------------------
   TEMPO DE SERVIDOR
   --------------------------------------------------------- */
let serverOffset = 0;
function watchServerOffset(db){
  try{
    db.ref('.info/serverTimeOffset').on('value', s => {
      const v = s.val();
      if(typeof v === 'number' && isFinite(v)) serverOffset = v;
    });
  }catch(e){}
}
function serverNow(){ return Date.now() + serverOffset; }

/* =========================================================
   VOCABULÁRIO — custo em ovos e cor de cada nível
   nível 1 = 0 ovos · nível 2 = 1 ovo · … · nível n = n-1 ovos
   cores: 10 tons, do verde (1) ao vermelho (10 ou mais)
   ========================================================= */
function custoNivel(n){ return Math.max(0, (Number(n)||1) - 1); }

/* nível 1: verde · 2 → 5: amarelo → laranja · 5 → 10 (ou mais): laranja → vermelho */
function corNivel(n){
  const k = Math.min(10, Math.max(1, Math.round(Number(n)||1)));
  if(k === 1) return 'hsl(120, 70%, 38%)';
  let hue;
  if(k <= 5) hue = 50 - ((k - 2) / 3) * (50 - 28);   // 50 (amarelo) → 28 (laranja)
  else       hue = 28 - ((k - 5) / 5) * 28;          // 28 (laranja) → 0 (vermelho)
  return `hsl(${hue.toFixed(0)}, 92%, 46%)`;
}
function rotuloNivel(n){ return n >= 10 ? '10+' : String(n); }

/* converte um bloco de texto "termo — tradução (n)" (uma linha por termo)
   em lista [{termo, traducao, nivel}]. Aceita marcadores (· • - *) e
   os separadores — – - com espaços ao redor. Sem (n) vira nível 1. */
function parseVocabulario(raw){
  const out = [];
  String(raw || '').split(/\r?\n/).forEach(linha => {
    let l = linha.replace(/^[\s·•\-*•]+/, '').trim();
    if(!l) return;
    let nivel = 1;
    const mn = l.match(/\((\d+)\)\s*$/);
    if(mn){ nivel = Math.max(1, parseInt(mn[1],10)); l = l.slice(0, mn.index).trim(); }
    const ms = l.match(/\s+[—–-]\s+/);
    if(!ms) return;
    const termo = l.slice(0, ms.index).trim();
    const traducao = l.slice(ms.index + ms[0].length).trim();
    if(termo && traducao) out.push({ termo, traducao, nivel });
  });
  return out;
}
function vocabParaTexto(vocab){
  return (vocab || []).map(v => `${v.termo} — ${v.traducao} (${v.nivel})`).join('\n');
}

/* localiza cada termo no texto, na ordem em que aparecem no vocabulário.
   Devolve segmentos [{t:'texto', v:indiceDoVocab|null}] e a lista de
   índices que não foram encontrados. */
const RE_LETRA = /[\p{L}\p{N}]/u;
function normTxt(s){ return String(s).toLowerCase().replace(/[’‘`´]/g, "'"); }

function segmentarTexto(texto, vocab){
  const original = String(texto || '');
  const low = normTxt(original);
  const marcas = [];
  const naoAchados = [];

  const limiteOk = (ini, fim, termo) => {
    const antes = ini > 0 ? low[ini-1] : '';
    const depois = fim < low.length ? low[fim] : '';
    const t0 = termo[0], t1 = termo[termo.length-1];
    if(antes && RE_LETRA.test(antes) && RE_LETRA.test(t0)) return false;
    if(depois && RE_LETRA.test(depois) && RE_LETRA.test(t1)) return false;
    return true;
  };
  const sobrepoe = (ini, fim) => marcas.some(m => ini < m.fim && fim > m.ini);

  let cursor = 0;
  (vocab || []).forEach((v, vi) => {
    const termo = normTxt(v.termo).trim();
    if(!termo){ naoAchados.push(vi); return; }
    let achou = -1;
    // 1) segue a ordem do vocabulário a partir do cursor
    let idx = low.indexOf(termo, cursor);
    while(idx !== -1){
      if(limiteOk(idx, idx + termo.length, termo) && !sobrepoe(idx, idx + termo.length)){ achou = idx; break; }
      idx = low.indexOf(termo, idx + 1);
    }
    // 2) reserva: qualquer ocorrência livre desde o início
    if(achou === -1){
      idx = low.indexOf(termo, 0);
      while(idx !== -1){
        if(limiteOk(idx, idx + termo.length, termo) && !sobrepoe(idx, idx + termo.length)){ achou = idx; break; }
        idx = low.indexOf(termo, idx + 1);
      }
      if(achou !== -1){ marcas.push({ ini:achou, fim:achou + termo.length, vi }); return; }
    }
    if(achou === -1){ naoAchados.push(vi); return; }
    marcas.push({ ini:achou, fim:achou + termo.length, vi });
    cursor = achou + termo.length;
  });

  marcas.sort((a,b) => a.ini - b.ini);
  const segs = [];
  let pos = 0;
  marcas.forEach(m => {
    if(m.ini > pos) segs.push({ t: original.slice(pos, m.ini), v:null });
    segs.push({ t: original.slice(m.ini, m.fim), v:m.vi });
    pos = m.fim;
  });
  if(pos < original.length) segs.push({ t: original.slice(pos), v:null });
  return { segs, naoAchados };
}

/* =========================================================
   RANKING — mais ovos em primeiro; empate divide a posição
   ========================================================= */
function listaRanking(jog){
  const l = Object.entries(jog || {}).map(([id,j]) => ({
    id, ...j, ovos: typeof j.ovos === 'number' ? j.ovos : OVOS_INICIAIS
  }));
  l.sort((a,b) => b.ovos - a.ovos || String(a.apelido).localeCompare(String(b.apelido)));
  l.forEach((j,i) => { j.pos = (i > 0 && l[i-1].ovos === j.ovos) ? l[i-1].pos : i + 1; });
  return l;
}
function linhaRanking(j, euId){
  return `
    <div class="rank-row${j.id === euId ? ' eu' : ''}" data-id="${esc(j.id)}">
      <span class="chip-num">${j.pos}</span>
      <img src="${galoDe(j.personagem)}" alt="" decoding="sync" onerror="this.onerror=null;this.src=avatarFallback('${jsStr(j.personagem||'')}')">
      <span class="rank-name">${esc(j.apelido)}</span>
      <span class="rank-ovos">🥚 ${formatScore(j.ovos)}</span>
    </div>`;
}

/* =========================================================
   JSON DO JOGO
   formato:
   { "titulo": "...", "descricao": "...",
     "paragrafos": [ { "texto": "...",
        "vocabulario": [ { "termo":"...", "traducao":"...", "nivel":1 } ] } ] }
   ========================================================= */
function normParagrafo(p){
  const vocab = Array.isArray(p.vocabulario) ? p.vocabulario : [];
  return {
    texto: String(p.texto || ''),
    vocabulario: vocab.map(v => ({
      termo: String(v.termo || ''),
      traducao: String(v.traducao || ''),
      nivel: Math.max(1, parseInt(v.nivel, 10) || 1)
    })).filter(v => v.termo && v.traducao)
  };
}

function validarJogo(obj){
  const erros = [];
  if(!obj || typeof obj !== 'object'){ erros.push('o arquivo não contém um objeto JSON válido'); return erros; }
  if(!obj.titulo) erros.push('falta o campo "titulo"');
  if(!Array.isArray(obj.paragrafos) || obj.paragrafos.length === 0){
    erros.push('falta a lista "paragrafos" (ou ela está vazia)');
    return erros;
  }
  obj.paragrafos.forEach((p,i) => {
    const n = i + 1;
    if(!p || typeof p !== 'object'){ erros.push(`parágrafo ${n}: não é um objeto`); return; }
    if(!p.texto) erros.push(`parágrafo ${n}: falta o "texto"`);
    if(!Array.isArray(p.vocabulario) || p.vocabulario.length === 0){
      erros.push(`parágrafo ${n}: falta a lista "vocabulario"`);
      return;
    }
    p.vocabulario.forEach((v,k) => {
      if(!v || !v.termo || !v.traducao) erros.push(`parágrafo ${n}, item ${k+1}: precisa de "termo" e "traducao"`);
      else if(v.nivel !== undefined && !(Number(v.nivel) >= 1)) erros.push(`parágrafo ${n}, "${v.termo}": "nivel" precisa ser um número de 1 em diante`);
    });
  });
  return erros;
}
