/* =========================================================
   JEU DES OEUFS — host.js
   Tela do professor: criar/importar o jogo, lobby com PIN e QR
   e, durante o jogo, SOMENTE o ranking ao vivo.
   ========================================================= */

const HOST_KEY = 'oeufs_host_v1';

const H = {
  tela:'abertura',     // abertura | editor | lobby | jogo
  pin:null,
  quiz:{ titulo:'', descricao:'', paragrafos:[] },   // paragrafos: [{texto, vocabRaw}]
  jogadores:{},
  erros:[],
  resumed:false
};
let hostListeners = [];

/* =========================================================
   PERSISTÊNCIA
   ========================================================= */
function salvarHost(){
  saveState(HOST_KEY, { v:1, tela:H.tela, pin:H.pin, quiz:H.quiz });
}
function apagarJogo(){
  if(!H.pin) return;
  try{ gameRef(H.pin).update({ meta:null, paragrafos:null, estado:null, jogadores:null }); }catch(e){}
}
function reiniciarHost(){
  if(!confirm('Encerrar este jogo e voltar ao início? Os alunos serão desconectados.')) return;
  playSound('click');
  apagarJogo();
  clearState(HOST_KEY);
  location.reload();
}

/* =========================================================
   RENDER
   ========================================================= */
function render(){
  renderTopbar();
  const c = document.getElementById('content');
  const rolavel = (H.tela === 'editor');
  document.body.classList.toggle('scroll-ok', rolavel);
  document.documentElement.style.overflow = rolavel ? '' : 'hidden';
  let html;
  switch(H.tela){
    case 'editor': html = telaEditor(); break;
    case 'lobby':  html = telaLobby(); break;
    case 'jogo':   html = telaRanking(); break;
    default:       html = telaAbertura();
  }
  c.innerHTML = `<div id="fit">${html}</div>`;
  if(H.tela === 'lobby') desenharQR();
  if(H.tela === 'editor') H.quiz.paragrafos.forEach((_,i) => atualizarAviso(i));
  ajustarEscala();
  salvarHost();
}

/* se o conteúdo passar da altura da tela, reduz tudo proporcionalmente */
function ajustarEscala(){
  const fit = document.getElementById('fit');
  if(!fit) return;
  fit.style.transform = ''; fit.style.width = ''; fit.style.height = '';
  if(document.body.classList.contains('scroll-ok')) return;
  const h = fit.clientHeight, sh = fit.scrollHeight;
  if(!h || sh <= h + 1) return;
  const s = Math.max(0.4, (h / sh) * 0.985);
  fit.style.width  = (100 / s) + '%';
  fit.style.height = (h / s) + 'px';
  fit.style.transform = `scale(${s})`;
}
window.addEventListener('resize', ajustarEscala);
if(document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarEscala);
window.addEventListener('load', ajustarEscala);

function renderTopbar(){
  const bar = document.getElementById('topbar');
  let label = 'jeu des oeufs · professor';
  if(H.tela === 'lobby') label = `jeu des oeufs · pin ${H.pin}`;
  else if(H.tela === 'jogo') label = `jeu des oeufs · ${H.quiz.titulo || ''}`;
  else if(H.tela === 'editor') label = 'jeu des oeufs · montando o jogo';
  const botoes = (H.tela === 'abertura' || H.tela === 'editor') ? '' : `
    <button class="mute-btn" title="som" onclick="alternarSom(this)">${som.icon()}</button>
    <button class="restart-btn" title="encerrar e recomeçar" onclick="reiniciarHost()">&#8634;</button>`;
  bar.innerHTML = `
    ${H.resumed ? `<span class="resume-note">jogo retomado de onde você parou</span>` : ''}
    <div class="topbar-row">
      <img src="images/LOGO.png" alt="" class="topbar-logo" onerror="this.style.display='none'">
      <span class="level-label">${esc(label)}</span>
      ${botoes}
    </div>`;
}
function alternarSom(btn){ btn.innerText = som.toggle() ? '🔇' : '🔊'; }

/* =========================================================
   TELA — ABERTURA
   ========================================================= */
function telaAbertura(){
  const salvo = loadState(HOST_KEY);
  const retomar = (salvo && salvo.pin)
    ? `<button class="btn-ghost btn" onclick="retomarJogo()">retomar o jogo ${esc(salvo.pin)}</button>` : '';
  return `
    <div class="home-card">
      <div class="ovo-grande">🥚</div>
      <h1>jeu des oeufs</h1>
      <p class="home-sub">Os alunos traduzem os textos no caderno clicando nos vocábulos.<br>
        Cada pista custa ovos — quem guardar mais ovos vence!</p>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn" onclick="criarDoZero()">criar um jogo</button>
        <button class="btn btn-ghost" onclick="document.getElementById('jsonFile').click()">importar json</button>
      </div>
      ${retomar}
      ${H.erros.length ? caixaErros('Não consegui usar esse arquivo:') : ''}
    </div>
    <div class="footer-space"></div>`;
}
function caixaErros(titulo){
  return `<div class="gabarito">${esc(titulo)}
    <ul>${H.erros.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
}

/* =========================================================
   CRIAÇÃO / IMPORTAÇÃO
   ========================================================= */
function paragrafoVazio(){ return { texto:'', vocabRaw:'' }; }
function criarDoZero(){
  playSound('click');
  H.erros = [];
  H.quiz = { titulo:'', descricao:'', paragrafos:[paragrafoVazio()] };
  H.tela = 'editor';
  render();
}
function importarArquivo(ev){
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if(!file) return;
  playSound('click');
  const fr = new FileReader();
  fr.onload = () => {
    let obj = null;
    try{ obj = JSON.parse(fr.result); }
    catch(e){ H.erros = ['o arquivo não é um JSON válido (confira vírgulas e aspas)']; H.tela = 'abertura'; render(); return; }
    const erros = validarJogo(obj);
    if(erros.length){ H.erros = erros; H.tela = 'abertura'; render(); return; }
    H.erros = [];
    H.quiz = {
      titulo: String(obj.titulo || ''),
      descricao: String(obj.descricao || ''),
      paragrafos: obj.paragrafos.map(normParagrafo).map(p => ({ texto:p.texto, vocabRaw:vocabParaTexto(p.vocabulario) }))
    };
    H.tela = 'editor';
    render();
  };
  fr.readAsText(file);
}
function paragrafosPublicaveis(){
  return H.quiz.paragrafos.map(p => ({ texto:p.texto.trim(), vocabulario:parseVocabulario(p.vocabRaw) }));
}
function baixarJson(){
  playSound('click');
  const data = JSON.stringify({
    titulo: H.quiz.titulo, descricao: H.quiz.descricao, paragrafos: paragrafosPublicaveis()
  }, null, 2);
  const blob = new Blob([data], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (H.quiz.titulo || 'jeu-des-oeufs').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* =========================================================
   TELA — EDITOR
   ========================================================= */
function telaEditor(){
  const cards = H.quiz.paragrafos.map((p,i) => `
    <div class="q-card">
      <div class="q-head">
        <span class="chip-num">${i+1}</span>
        <span class="mini-label">parágrafo (fase ${i+1})</span>
        <span class="q-tools">
          <button class="icon-btn" title="subir" onclick="moverParagrafo(${i},-1)">↑</button>
          <button class="icon-btn" title="descer" onclick="moverParagrafo(${i},1)">↓</button>
          <button class="icon-btn danger" title="remover" onclick="removerParagrafo(${i})">✕</button>
        </span>
      </div>
      <p class="field-label" style="margin:0">texto</p>
      <textarea placeholder="cole aqui o texto do parágrafo" oninput="setTexto(${i},this.value)">${esc(p.texto)}</textarea>
      <p class="field-label" style="margin:0">vocabulário · um por linha: termo — tradução (nível)</p>
      <textarea class="vocab" placeholder="Après — depois de (1)&#10;l'école — a escola (1)&#10;Chez — na casa de (2)" oninput="setVocab(${i},this.value)">${esc(p.vocabRaw)}</textarea>
      <div id="aviso-${i}"></div>
    </div>`).join('');

  return `
    <div class="intro-card">
      <span class="intro-tag">passo 1 · o conteúdo</span>
      <p class="field-label">título do jogo</p>
      <input type="text" class="text-input" style="text-align:left" value="${esc(H.quiz.titulo)}"
             placeholder="ex.: Jeu des Oeufs — Chapitre 2" oninput="H.quiz.titulo=this.value; salvarHost()">
      <p class="field-label">descrição (opcional)</p>
      <input type="text" class="text-input" style="text-align:left" value="${esc(H.quiz.descricao)}"
             placeholder="uma linha sobre o jogo" oninput="H.quiz.descricao=this.value; salvarHost()">
      <div class="ajuda-card">
        Cada <strong>parágrafo</strong> vira uma fase. No vocabulário, escreva os termos
        <strong>na ordem em que aparecem no texto</strong>, no formato
        <code>termo — tradução (nível)</code>. O nível define a cor e o custo:
        nível 1 = grátis (verde), nível 2 = 1 ovo, nível 3 = 2 ovos… nível 10 ou mais = vermelho.
        Cada aluno começa com ${OVOS_INICIAIS} ovos.
      </div>
    </div>

    <div class="editor-list">${cards}</div>

    <div class="btn-row">
      <button class="btn btn-ghost" onclick="adicionarParagrafo()">+ adicionar parágrafo</button>
      <button class="btn btn-ghost" onclick="baixarJson()">baixar json</button>
      <button class="btn btn-ghost" onclick="document.getElementById('jsonFile').click()">trocar por outro json</button>
    </div>
    ${H.erros.length ? caixaErros('Ajuste antes de abrir a sala:') : ''}
    <div class="footer-space"></div>
    <button class="btn btn-block" onclick="abrirSala()">abrir a sala</button>`;
}

/* aviso ao vivo: termos não encontrados no texto / linhas fora do formato */
function atualizarAviso(i){
  const el = document.getElementById('aviso-' + i);
  const p = H.quiz.paragrafos[i];
  if(!el || !p) return;
  const vocab = parseVocabulario(p.vocabRaw);
  const linhas = p.vocabRaw.split(/\r?\n/).filter(l => l.trim()).length;
  const ruins = linhas - vocab.length;
  let html = '';
  if(ruins > 0) html += `<div class="q-aviso">${ruins} linha(s) do vocabulário fora do formato "termo — tradução (nível)" foram ignoradas.</div>`;
  if(vocab.length && p.texto.trim()){
    const { naoAchados } = segmentarTexto(p.texto, vocab);
    if(naoAchados.length){
      html += `<div class="q-aviso" style="margin-top:6px">não encontrei no texto: ${naoAchados.map(k => esc(vocab[k].termo)).join(' · ')}</div>`;
    } else {
      html += `<div class="q-ok">✓ ${vocab.length} termos localizados no texto</div>`;
    }
  }
  el.innerHTML = html;
}

function setTexto(i,v){ H.quiz.paragrafos[i].texto = v; salvarHost(); atualizarAviso(i); }
function setVocab(i,v){ H.quiz.paragrafos[i].vocabRaw = v; salvarHost(); atualizarAviso(i); }
function adicionarParagrafo(){ playSound('click'); H.quiz.paragrafos.push(paragrafoVazio()); render(); }
function removerParagrafo(i){
  if(H.quiz.paragrafos.length === 1){ alert('O jogo precisa de pelo menos um parágrafo.'); return; }
  if(!confirm(`Remover o parágrafo ${i+1}?`)) return;
  playSound('click'); H.quiz.paragrafos.splice(i,1); render();
}
function moverParagrafo(i,d){
  const j = i + d;
  if(j < 0 || j >= H.quiz.paragrafos.length) return;
  playSound('click');
  const a = H.quiz.paragrafos;
  [a[i],a[j]] = [a[j],a[i]];
  render();
}

function validarAntesDeAbrir(){
  const erros = [];
  if(!H.quiz.titulo.trim()) erros.push('dê um título ao jogo');
  H.quiz.paragrafos.forEach((p,i) => {
    if(!p.texto.trim()) erros.push(`parágrafo ${i+1}: falta o texto`);
    if(!parseVocabulario(p.vocabRaw).length) erros.push(`parágrafo ${i+1}: o vocabulário está vazio ou fora do formato`);
  });
  return erros;
}

/* =========================================================
   ABRIR A SALA
   ========================================================= */
async function gerarPin(){
  for(let t = 0; t < 25; t++){
    const pin = String(Math.floor(100000 + Math.random()*900000));
    const snap = await gameRef(pin,'meta').get();
    if(!snap.exists()) return pin;
  }
  throw new Error('sem pin livre');
}

async function abrirSala(){
  playSound('click');
  const erros = validarAntesDeAbrir();
  if(erros.length){ H.erros = erros; render(); return; }
  H.erros = [];
  if(!db){ H.erros = ['sem conexão com o Firebase — confira o firebase-config.js']; render(); return; }
  try{
    H.pin = await gerarPin();
    const paragrafos = paragrafosPublicaveis();
    await gameRef(H.pin).update({
      meta:{
        titulo:H.quiz.titulo, descricao:H.quiz.descricao,
        criadoEm: SERVER_TS, totalParagrafos: paragrafos.length
      },
      paragrafos,
      estado:{ fase:'lobby', total:paragrafos.length }
    });
    H.tela = 'lobby';
    ouvirJogo();
    render();
  }catch(e){
    H.erros = ['não consegui criar a sala; verifique a conexão e as regras do banco'];
    render();
  }
}

/* =========================================================
   TELA — LOBBY
   ========================================================= */
function linkDoJogador(){
  const base = location.href.split('?')[0].replace(/host\.html$/,'');
  return base + 'player.html?pin=' + H.pin;
}

function telaLobby(){
  const lista = Object.entries(H.jogadores).map(([id,j]) => `
    <div class="player-chip">
      <img src="${retratoDe(j.personagem)}" alt="${esc(j.apelido)}" onerror="this.onerror=null;this.src=avatarFallback('${jsStr(j.personagem||'')}')">
      <span class="player-name">${esc(j.apelido)}</span>
    </div>`).join('');
  const n = Object.keys(H.jogadores).length;
  return `
    <div class="question-card" style="animation:none">
      <p class="instruction">${esc(H.quiz.titulo)} · ${H.quiz.paragrafos.length} parágrafos</p>
      <div class="lobby-split">
        <div style="text-align:center">
          <p class="instruction">entre em <strong>${esc(linkDoJogador().replace(/^https?:\/\//,'').split('?')[0])}</strong></p>
          <div class="pin-big">${esc(H.pin||'')}</div>
        </div>
        <div class="qr-box"><div id="qrcode"></div></div>
      </div>
      <p class="home-sub" style="margin-top:10px">ou aponte a câmera para o QR code</p>
    </div>

    <div class="question-card" style="animation:none">
      <p class="instruction">${n === 0 ? 'ninguém entrou ainda' : `${n} na sala`}</p>
      <div class="lobby-grid">${lista}</div>
    </div>
    <div class="footer-space"></div>
    <button class="btn btn-block" onclick="iniciarJogo()" ${n===0?'disabled':''}>
      ${n===0 ? 'aguardando alunos…' : 'começar o jogo'}
    </button>`;
}

let qrFeito = null;
function desenharQR(){
  const el = document.getElementById('qrcode');
  if(!el || typeof QRCode === 'undefined') return;
  el.innerHTML = '';
  try{
    new QRCode(el, { text: linkDoJogador(), width:200, height:200, correctLevel: QRCode.CorrectLevel.M });
    qrFeito = H.pin;
  }catch(e){}
}

async function iniciarJogo(){
  playSound('click');
  if(!Object.keys(H.jogadores).length) return;
  try{ await gameRef(H.pin,'estado').set({ fase:'jogo', total:H.quiz.paragrafos.length, iniciadoEm: SERVER_TS }); }catch(e){}
  H.tela = 'jogo';
  render();
}

/* =========================================================
   TELA — RANKING AO VIVO (a única tela do host durante o jogo)
   ========================================================= */
function linhasRanking(){
  return listaRanking(H.jogadores).map(j => linhaRanking(j, null)).join('');
}
function classeLista(){
  return 'rank-list' + (Object.keys(H.jogadores).length > 10 ? ' duas' : '');
}
function telaRanking(){
  return `
    <div class="question-card ranking-grande" style="animation:none">
      <p class="instruction">🥚 ranking ao vivo</p>
      <div class="${classeLista()}" id="rankList">${linhasRanking()}</div>
    </div>`;
}

/* atualiza só a lista (sem redesenhar a tela) e anima quem mudou de posição */
function atualizarRanking(){
  const el = document.getElementById('rankList');
  if(!el){ render(); return; }
  const antes = {};
  el.querySelectorAll('.rank-row[data-id]').forEach(r => { antes[r.dataset.id] = r.offsetTop; });
  el.className = classeLista();
  el.innerHTML = linhasRanking();
  ajustarEscala();
  const reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduzido) return;
  el.querySelectorAll('.rank-row[data-id]').forEach(row => {
    const id = row.dataset.id;
    if(!(id in antes)) return;
    const d = antes[id] - row.offsetTop;
    if(!d) return;
    row.style.transition = 'none';
    row.style.transform = `translateY(${d}px)`;
    row.style.zIndex = d > 0 ? '3' : '1';
    void row.offsetHeight;
    requestAnimationFrame(() => {
      row.style.transition = 'transform .6s cubic-bezier(.34,1.3,.64,1)';
      row.style.transform = '';
      if(d > 0){
        row.classList.add('rank-move-up');
        setTimeout(() => row.classList.remove('rank-move-up'), 800);
      }
      setTimeout(() => { row.style.zIndex = ''; row.style.transition = ''; }, 700);
    });
  });
}

/* =========================================================
   ESCUTA DO FIREBASE
   ========================================================= */
function ouvirJogo(){
  hostListeners.forEach(l => { try{ l.ref.off(l.ev, l.cb); }catch(e){} });
  hostListeners = [];
  const ref = gameRef(H.pin, 'jogadores');
  const cb = s => {
    H.jogadores = s.val() || {};
    if(H.tela === 'jogo') atualizarRanking();
    else if(H.tela === 'lobby') render();
  };
  ref.on('value', cb);
  hostListeners.push({ ref, ev:'value', cb });
}

/* =========================================================
   RETOMADA
   ========================================================= */
async function retomarJogo(){
  const salvo = loadState(HOST_KEY);
  if(!salvo || !salvo.pin) return;
  playSound('click');
  try{
    const snap = await gameRef(salvo.pin).get();
    if(!snap.exists()){ clearState(HOST_KEY); H.erros = ['o jogo salvo não existe mais no servidor']; render(); return; }
    const g = snap.val();
    H.pin = salvo.pin;
    const pars = Array.isArray(g.paragrafos) ? g.paragrafos : [];
    H.quiz = {
      titulo:(g.meta||{}).titulo || '', descricao:(g.meta||{}).descricao || '',
      paragrafos: pars.map(normParagrafo).map(p => ({ texto:p.texto, vocabRaw:vocabParaTexto(p.vocabulario) }))
    };
    H.jogadores = g.jogadores || {};
    H.resumed = true;
    H.erros = [];
    H.tela = ((g.estado || {}).fase === 'jogo') ? 'jogo' : 'lobby';
    ouvirJogo();
    render();
  }catch(e){
    H.erros = ['não consegui retomar o jogo; verifique a conexão'];
    render();
  }
}

/* =========================================================
   BOOT
   ========================================================= */
(function boot(){
  const salvo = loadState(HOST_KEY);
  if(salvo && salvo.quiz && !salvo.pin && salvo.tela === 'editor' && (salvo.quiz.paragrafos || []).length){
    H.quiz = {
      titulo: salvo.quiz.titulo || '', descricao: salvo.quiz.descricao || '',
      paragrafos: salvo.quiz.paragrafos.map(p => ({ texto:String(p.texto||''), vocabRaw:String(p.vocabRaw||'') }))
    };
    H.tela = 'editor'; H.resumed = true;
  }
  render();
})();
