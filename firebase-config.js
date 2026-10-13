/* =========================================================
   JEU DES OEUFS — firebase-config.js
   Substitua os valores abaixo pelos do SEU projeto:
   Firebase Console › Configurações do projeto › Seus apps › Web
   Inclua "databaseURL" (Build › Realtime Database › URL no topo)
   caso o seu projeto não esteja na região padrão.
   ========================================================= */

const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  databaseURL: "https://SEU-PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "COLE_AQUI"
};

/* inicialização (SDK compat carregado por CDN nas páginas) */
let db = null;
try{
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  watchServerOffset(db);
}catch(e){
  console.error('Falha ao iniciar o Firebase. Confira o firebase-config.js.', e);
}

const SERVER_TS = (typeof firebase !== 'undefined' && firebase.database)
  ? firebase.database.ServerValue.TIMESTAMP
  : Date.now();

function gameRef(pin, sub){
  return db.ref('games/' + pin + (sub ? '/' + sub : ''));
}
