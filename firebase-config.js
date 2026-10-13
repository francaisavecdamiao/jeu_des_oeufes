/* =========================================================
   JEU DES OEUFS — firebase-config.js
   Substitua os valores abaixo pelos do SEU projeto:
   Firebase Console › Configurações do projeto › Seus apps › Web
   Inclua "databaseURL" (Build › Realtime Database › URL no topo)
   caso o seu projeto não esteja na região padrão.
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyB15yAKNPROKQ2e36e7H_fp57ezpnNK9xo",
  authDomain: "jeu-des-oeufs.firebaseapp.com",
  databaseURL: "https://jeu-des-oeufs-default-rtdb.firebaseio.com",
  projectId: "jeu-des-oeufs",
  storageBucket: "jeu-des-oeufs.firebasestorage.app",
  messagingSenderId: "84953040188",
  appId: "1:84953040188:web:3a6e659e59a20993b38a39",
  measurementId: "G-CHKF65SZBN"
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
