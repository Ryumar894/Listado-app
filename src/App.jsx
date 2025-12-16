import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, setDoc 
} from "firebase/firestore";

// --- CONFIGURACIÓN (TU MISMA CONFIGURACIÓN) ---
const firebaseConfig = {
  apiKey: "AIzaSyCYKvO_rQo8gKNHNNrAtMb8CDv2l7Ch2xk",
  authDomain: "mis-finanzas-app-c6de7.firebaseapp.com",
  projectId: "mis-finanzas-app-c6de7",
  storageBucket: "mis-finanzas-app-c6de7.firebasestorage.app",
  messagingSenderId: "67154196666",
  appId: "1:67154196666:web:00536e3072f7dddb712a83"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- COMPONENTES ESTILIZADOS (TEMA OSCURO ELEGANTE) ---

// Tarjetas: Fondo gris oscuro, borde sutil, sin sombra pesada
const Card = ({ children, className = '' }) => (
  <div className={`bg-zinc-900 rounded-2xl border border-zinc-800 p-5 ${className}`}>{children}</div>
);

// Botones: Acento dorado, texto oscuro para contraste en el primario
const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
  const styles = {
    primary: "bg-amber-500 text-zinc-900 hover:bg-amber-400 font-bold",
    secondary: "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 font-medium",
    success: "bg-emerald-600 text-white hover:bg-emerald-500 font-bold",
    danger: "bg-red-600 text-white hover:bg-red-500 font-bold",
  };
  return (
    <button onClick={onClick} className={`px-4 py-3 rounded-xl transition-all active:scale-95 tracking-wide ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

// Inputs: Fondo oscuro, texto claro, borde dorado al enfocar
const inputClasses = "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-100 placeholder-zinc-500 transition-all";

// --- PANTALLA DE ACCESO DARK ---
const Login = ({ onEnter }) => {
  const [pin, setPin] = useState('');
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center py-12 border-zinc-800/50">
        <div className="text-5xl mb-6 opacity-80">🖤</div>
        <h1 className="text-xl font-medium text-zinc-100 mb-2 tracking-wider uppercase">Acceso Privado</h1>
        <p className="text-zinc-500 mb-8 text-sm">Introduce la clave de equipo</p>
        <input 
          type="password" 
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          className="text-center text-3xl tracking-[1em] w-full border-b border-zinc-700 focus:border-amber-500 outline-none py-2 mb-8 bg-transparent text-amber-500 placeholder-zinc-700 transition-colors"
          maxLength={4}
        />
        <Button onClick={() => pin === '0607' ? onEnter() : alert('Clave incorrecta')} className="w-full">Entrar</Button>
      </Card>
    </div>
  );
};

// --- APP PRINCIPAL DARK ---
export default function App() {
  const [auth, setAuth] = useState(false);
  const [balance, setBalance] = useState(0);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [newItem, setNewItem] = useState('');
  const [moneyAmount, setMoneyAmount] = useState('');
  const [moneyDesc, setMoneyDesc] = useState('');
  const [showMoneyForm, setShowMoneyForm] = useState(false);

  // (La lógica de Firebase sigue igual, solo cambian los estilos visuales)
  useEffect(() => {
    if (!auth) return;
    const balanceRef = doc(db, "couple_wallet", "general");
    const unsubBalance = onSnapshot(balanceRef, (snap) => {
      if (snap.exists()) setBalance(snap.data().amount);
      else setDoc(balanceRef, { amount: 0 });
    });
    const qItems = query(collection(db, "couple_items"), orderBy("createdAt", "desc"));
    const unsubItems = onSnapshot(qItems, (snap) => setItems(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const qHistory = query(collection(db, "couple_history"), orderBy("date", "desc"));
    const unsubHistory = onSnapshot(qHistory, (snap) => setHistory(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubBalance(); unsubItems(); unsubHistory(); };
  }, [auth]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem) return;
    await addDoc(collection(db, "couple_items"), { name: newItem, createdAt: new Date() });
    setNewItem('');
  };

  const handleMarkDone = async (id) => {
    await deleteDoc(doc(db, "couple_items", id));
  };

  const handleTransaction = async (type) => {
    const val = parseFloat(moneyAmount);
    if (!val || isNaN(val)) return alert("Cantidad inválida");
    if (!moneyDesc) return alert("Falta descripción");
    const newBalance = type === 'income' ? balance + val : balance - val;
    await updateDoc(doc(db, "couple_wallet", "general"), { amount: newBalance });
    await addDoc(collection(db, "couple_history"), {
      description: moneyDesc, amount: val, type: type, date: new Date().toISOString()
    });
    setMoneyAmount(''); setMoneyDesc(''); setShowMoneyForm(false);
  };

  if (!auth) return <Login onEnter={() => setAuth(true)} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans pb-20">
      {/* HEADER SALDO DARK */}
      <div className="bg-zinc-900 p-6 rounded-b-3xl border-b border-zinc-800 text-center relative z-10">
        <p className="text-amber-500/80 text-xs font-medium tracking-[0.2em] uppercase mb-1">Fondo Común</p>
        <h1 className="text-5xl font-light text-white my-2 tracking-tight">
          $<span className="font-bold">{balance.toLocaleString()}</span>
        </h1>
        
        {/* Botón Toggle Dark */}
        <button 
          onClick={() => setShowMoneyForm(!showMoneyForm)}
          className={`mt-5 text-sm font-medium px-5 py-2.5 rounded-full transition-all border ${showMoneyForm ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-amber-950/30 text-amber-400 border-amber-900/50 hover:bg-amber-900/50'}`}
        >
          {showMoneyForm ? '✕ Cerrar' : '＋ Registrar Movimiento'}
        </button>

        {/* PANEL DE REGISTRO DARK */}
        {showMoneyForm && (
          <div className="mt-6 bg-zinc-800/50 border border-zinc-700 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
            <input 
              type="text" 
              placeholder="Descripción (ej. Ticket HEB)" 
              className={`${inputClasses} mb-3 bg-zinc-900/80 border-zinc-800`}
              value={moneyDesc}
              onChange={e => setMoneyDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="$0.00" 
                className={`${inputClasses} font-bold text-lg bg-zinc-900/80 border-zinc-800`}
                value={moneyAmount}
                onChange={e => setMoneyAmount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="success" onClick={() => handleTransaction('income')} className="text-sm py-2.5">
                ＋ Ingreso
              </Button>
              <Button variant="danger" onClick={() => handleTransaction('expense')} className="text-sm py-2.5">
                － Gastar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-8 mt-4">
        
        {/* SECCIÓN 1: LISTA DEL SÚPER DARK */}
        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-3 px-2 flex items-center justify-between uppercase tracking-wider">
            <span>🛒 Lista del Súper</span>
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs">{items.length}</span>
          </h2>
          
          <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Agregar ítem..." 
              className={`${inputClasses} flex-1 bg-zinc-900 border-zinc-800 shadow-sm`}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
            />
            <Button className="px-5 bg-amber-500 hover:bg-amber-400 text-zinc-900">＋</Button>
          </form>

          <div className="space-y-2">
            {items.length === 0 && (
              <div className="text-center py-8 opacity-30">
                <p className="text-3xl mb-2">✨</p>
                <p className="text-sm font-light">Todo limpio</p>
              </div>
            )}
            {items.map(item => (
              <Card key={item.id} className="flex items-center justify-between !p-3.5 hover:border-zinc-700 transition-colors group bg-zinc-900/80">
                <span className="font-medium text-zinc-200">{item.name}</span>
                <button 
                  onClick={() => handleMarkDone(item.id)}
                  className="text-zinc-500 hover:text-amber-400 p-2 rounded-lg text-sm transition-colors opacity-50 group-hover:opacity-100"
                  title="Marcar como listo"
                >
                  ✓ Listo
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* SECCIÓN 2: HISTORIAL DARK */}
        <section>
          <h2 className="text-sm font-medium text-zinc-400 mb-3 px-2 mt-8 uppercase tracking-wider">📜 Últimos Tickets</h2>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
            {history.slice(0, 5).map(h => (
              <div key={h.id} className="flex justify-between items-center p-4 hover:bg-zinc-800/50 transition-colors">
                <div>
                  <p className="font-medium text-zinc-300">{h.description}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{new Date(h.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold ${h.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {h.type === 'income' ? '+' : '-'}${h.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {history.length === 0 && <p className="text-center py-6 text-xs text-zinc-600 uppercase tracking-widest">Sin movimientos</p>}
          </div>
        </section>

      </div>
    </div>
  );
}