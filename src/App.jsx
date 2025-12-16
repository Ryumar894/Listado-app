import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, setDoc 
} from "firebase/firestore";

// --- CONFIGURACIÓN ---
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

// --- COMPONENTES ---
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-pink-100 p-5 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
  const styles = {
    primary: "bg-pink-500 text-white hover:bg-pink-600 shadow-md shadow-pink-200",
    secondary: "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200",
  };
  return (
    <button onClick={onClick} className={`px-4 py-3 rounded-xl font-bold transition-all active:scale-95 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- PANTALLA DE ACCESO ---
const Login = ({ onEnter }) => {
  const [pin, setPin] = useState('');
  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">App Listado</h1>
        <p className="text-gray-400 mb-6">Ingresen su clave de equipo</p>
        <input 
          type="password" 
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          className="text-center text-3xl tracking-[1em] w-full border-b-2 border-pink-200 focus:border-pink-500 outline-none py-2 mb-6 bg-transparent"
          maxLength={4}
        />
        <Button onClick={() => pin === '0607' ? onEnter() : alert('Clave incorrecta 💔')} className="w-full">Entrar</Button>
      </Card>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [auth, setAuth] = useState(false);
  const [balance, setBalance] = useState(0);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Estados para formularios
  const [newItem, setNewItem] = useState('');
  const [moneyAmount, setMoneyAmount] = useState('');
  const [moneyDesc, setMoneyDesc] = useState('');
  const [showMoneyForm, setShowMoneyForm] = useState(false); // Para mostrar/ocultar panel de dinero

  // 1. Cargar Datos
  useEffect(() => {
    if (!auth) return;

    // A. Saldo Compartido
    const balanceRef = doc(db, "couple_wallet", "general");
    const unsubBalance = onSnapshot(balanceRef, (snap) => {
      if (snap.exists()) setBalance(snap.data().amount);
      else setDoc(balanceRef, { amount: 0 });
    });

    // B. Lista de Compras
    const qItems = query(collection(db, "couple_items"), orderBy("createdAt", "desc"));
    const unsubItems = onSnapshot(qItems, (snap) => setItems(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    // C. Historial
    const qHistory = query(collection(db, "couple_history"), orderBy("date", "desc"));
    const unsubHistory = onSnapshot(qHistory, (snap) => setHistory(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubBalance(); unsubItems(); unsubHistory(); };
  }, [auth]);

  // 2. Funciones Lógicas

  // AGREGAR COSA A LA LISTA
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem) return;
    await addDoc(collection(db, "couple_items"), { name: newItem, createdAt: new Date() });
    setNewItem('');
  };

  // MARCAR COMO COMPRADO (Solo borra de la lista, NO resta dinero)
  const handleMarkDone = async (id) => {
    // Simplemente lo borramos de la lista de pendientes
    await deleteDoc(doc(db, "couple_items", id));
  };

  // MANEJO DE DINERO (Ingreso o Gasto)
  const handleTransaction = async (type) => {
    const val = parseFloat(moneyAmount);
    if (!val || isNaN(val)) return alert("Pon una cantidad válida amor 🧐");
    if (!moneyDesc) return alert("Ponle nombre al movimiento (ej. Despensa)");

    const newBalance = type === 'income' ? balance + val : balance - val;

    // 1. Actualizar Saldo
    await updateDoc(doc(db, "couple_wallet", "general"), { amount: newBalance });
    
    // 2. Guardar en Historial
    await addDoc(collection(db, "couple_history"), {
      description: moneyDesc,
      amount: val,
      type: type, // 'income' o 'expense'
      date: new Date().toISOString()
    });

    setMoneyAmount('');
    setMoneyDesc('');
    setShowMoneyForm(false);
  };

  if (!auth) return <Login onEnter={() => setAuth(true)} />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* HEADER SALDO */}
      <div className="bg-white p-6 rounded-b-3xl shadow-sm border-b border-pink-100 text-center relative z-10">
        <p className="text-gray-400 text-sm font-medium tracking-wide">FONDO COMÚN</p>
        <h1 className="text-5xl font-black text-gray-800 my-2 tracking-tight">
          ${balance.toLocaleString()}
        </h1>
        
        {/* Botón para abrir panel de dinero */}
        <button 
          onClick={() => setShowMoneyForm(!showMoneyForm)}
          className="mt-4 text-sm font-bold text-pink-500 bg-pink-50 px-4 py-2 rounded-full hover:bg-pink-100 transition-colors"
        >
          {showMoneyForm ? '❌ Cerrar Panel' : '💸 Registrar Dinero / Ticket'}
        </button>

        {/* PANEL DE REGISTRO DE DINERO (Oculto por defecto) */}
        {showMoneyForm && (
          <div className="mt-6 bg-white border border-pink-100 p-4 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4">
            <input 
              type="text" 
              placeholder="Descripción (ej. Ticket HEB)" 
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mb-3 outline-none focus:border-pink-300"
              value={moneyDesc}
              onChange={e => setMoneyDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="$0.00" 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 outline-none focus:border-pink-300 font-bold text-gray-700"
                value={moneyAmount}
                onChange={e => setMoneyAmount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Button variant="success" onClick={() => handleTransaction('income')} className="text-sm">
                ＋ Ingreso
              </Button>
              <Button variant="danger" onClick={() => handleTransaction('expense')} className="text-sm">
                － Gastar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* SECCIÓN 1: LISTA DE DESEOS / SUPER */}
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3 px-2 flex items-center gap-2">
            🛒 Lista del Súper <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full text-xs">{items.length}</span>
          </h2>
          
          <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Agregar a la lista..." 
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-pink-400 shadow-sm"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
            />
            <Button className="px-6">＋</Button>
          </form>

          <div className="space-y-3">
            {items.length === 0 && (
              <div className="text-center py-8 opacity-50">
                <p className="text-4xl mb-2">✨</p>
                <p className="text-sm">Lista vacía</p>
              </div>
            )}
            {items.map(item => (
              <Card key={item.id} className="flex items-center justify-between !p-4 hover:shadow-md transition-shadow">
                <span className="font-semibold text-gray-700 text-lg">{item.name}</span>
                <button 
                  onClick={() => handleMarkDone(item.id)}
                  className="bg-gray-100 text-gray-400 hover:bg-emerald-100 hover:text-emerald-600 p-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                >
                  ✅ Listo
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* SECCIÓN 2: HISTORIAL DE MOVIMIENTOS */}
        <section className="opacity-80">
          <h2 className="text-lg font-bold text-gray-700 mb-3 px-2 mt-8">📜 Tickets y Movimientos</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
            {history.slice(0, 5).map(h => (
              <div key={h.id} className="flex justify-between items-center p-4">
                <div>
                  <p className="font-medium text-gray-800">{h.description}</p>
                  <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold ${h.type === 'income' ? 'text-emerald-500' : 'text-pink-500'}`}>
                  {h.type === 'income' ? '+' : '-'}${h.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {history.length === 0 && <p className="text-center py-4 text-sm text-gray-400">Sin movimientos aún</p>}
          </div>
        </section>

      </div>
    </div>
  );
}