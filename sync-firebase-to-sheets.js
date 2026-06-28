import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyAgso9pk_1JSigO4QFoildaN27nKdssKIE",
  authDomain: "temporaljv-aa2e2.firebaseapp.com",
  projectId: "temporaljv-aa2e2",
  storageBucket: "temporaljv-aa2e2.firebasestorage.app",
  messagingSenderId: "760406011353",
  appId: "1:760406011353:web:040f0d372b7e0096fefdc8"
};

const WEBHOOK_URL = process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  console.error("Error: VITE_GOOGLE_SHEETS_WEBHOOK_URL no está definida en el archivo .env");
  process.exit(1);
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper para pausar entre peticiones y evitar saturar Google Apps Script
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sync() {
  console.log("Iniciando sincronización de Firebase a Google Sheets...");

  // 1. Obtener confirmaciones (RSVPs)
  console.log("\n--- Cargando confirmaciones de Firebase ---");
  const rsvpsCol = collection(db, "rsvps");
  const rsvpsSnapshot = await getDocs(rsvpsCol);
  const rsvps = [];
  rsvpsSnapshot.forEach(doc => {
    rsvps.push(doc.data());
  });
  console.log(`Se encontraron ${rsvps.length} confirmaciones.`);

  // Enviar confirmaciones a Google Sheets
  for (let i = 0; i < rsvps.length; i++) {
    const r = rsvps[i];
    console.log(`[${i + 1}/${rsvps.length}] Enviando RSVP: ${r.name}`);
    
    const params = new URLSearchParams({
      type: "rsvp",
      name: r.name || "",
      attending: String(r.attending ?? true),
      familyGroup: r.familyGroup || "",
      submittedBy: r.submittedBy || "",
      phone: (r.phone || "").replace('+', ''),
    });

    try {
      const response = await fetch(`${WEBHOOK_URL}?${params.toString()}`);
      const data = await response.json();
      console.log(`  Respuesta: ${data.status}`);
    } catch (err) {
      console.error(`  Error enviando RSVP de ${r.name}:`, err.message);
    }
    
    // Pausa de 500ms entre peticiones
    await sleep(500);
  }

  // 2. Obtener sugerencias de canciones (Songs)
  console.log("\n--- Cargando sugerencias de canciones de Firebase ---");
  const songsCol = collection(db, "songs");
  const songsSnapshot = await getDocs(songsCol);
  const songs = [];
  songsSnapshot.forEach(doc => {
    songs.push(doc.data());
  });
  console.log(`Se encontraron ${songs.length} canciones sugeridas.`);

  // Enviar canciones a Google Sheets
  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    console.log(`[${i + 1}/${songs.length}] Enviando canción: ${s.title} - ${s.artist}`);

    const params = new URLSearchParams({
      type: "song",
      song: s.title || "",
      artist: s.artist || "",
      suggestedBy: s.suggestedBy || "",
    });

    try {
      const response = await fetch(`${WEBHOOK_URL}?${params.toString()}`);
      const data = await response.json();
      console.log(`  Respuesta: ${data.status}`);
    } catch (err) {
      console.error(`  Error enviando canción ${s.title}:`, err.message);
    }

    // Pausa de 500ms
    await sleep(500);
  }

  console.log("\n¡Sincronización finalizada!");
}

sync().catch(err => {
  console.error("Error general de sincronización:", err);
});
