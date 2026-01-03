import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Package, 
  Truck, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  Scissors, 
  Clock,
  ChevronRight,
  ChevronDown,
  Save,
  Trash2,
  X,
  Filter,
  ArrowRight,
  Search,
  Pencil,
  ArrowUpDown,
  CalendarDays,
  ListFilter,
  Download,
  Upload,
  FileSpreadsheet,
  LogOut,
  Lock,
  User
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut,
  signInWithCustomToken,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';

// --- Configuração do Firebase ---
import { firebaseConfig } from './firebaseConfig'; // Importa do arquivo que você criou

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Defina um nome fixo para sua aplicação (importante para separar os dados)
const appId = 'oficina-control-prod'; 

// --- CONFIGURAÇÃO DE ADMINISTRAÇÃO ---
const ADMIN_EMAIL = 'henrique@chocris.com.br'; 

// --- Componentes UI Auxiliares ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`} style={{ backgroundColor: '#ffffff' }}>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const styles = {
    'Pendente': 'bg-blue-100 text-blue-800',
    'Parcial': 'bg-amber-100 text-amber-800',
    'Concluído': 'bg-emerald-100 text-emerald-800',
    'Atrasado': 'bg-red-100 text-red-800'
  };
  // Normalização simples para evitar erros de acentuação
  const normStatus = Object.keys(styles).find(k => k.toLowerCase() === (status || '').toLowerCase()) || status;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[normStatus] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

// --- Helpers de Data Robustos ---

const parseDate = (value) => {
  if (!value) return new Date(); 
  if (value instanceof Date) return value;
  // Serial do Excel
  if (typeof value === 'number') {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  // String
  if (typeof value === 'string') {
    if (value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
    }
  }
  return new Date();
};

const formatDateForInput = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isDateInRange = (date, start, end) => {
  if (!date) return false;
  const d = new Date(date); d.setHours(0,0,0,0);
  if (start) {
    const s = new Date(start); s.setHours(0,0,0,0);
    if (d < s) return false;
  }
  if (end) {
    const e = new Date(end); e.setHours(23,59,59,999);
    if (d > e) return false;
  }
  return true;
};

// --- Tela de Login ---
const LoginScreen = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100" style={{ backgroundColor: '#ffffff' }}>
        <div className="bg-white p-8 text-center border-b border-slate-100" style={{ backgroundColor: '#ffffff' }}>
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <Scissors className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Oficina<span className="text-emerald-500">Control</span></h1>
          <p className="text-slate-500 text-sm mt-2">Gestão Inteligente de Facção</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition" placeholder="seu@email.com" style={{ backgroundColor: '#ffffff' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 p-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition" placeholder="••••••••" style={{ backgroundColor: '#ffffff' }} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
            {loading ? 'Entrando...' : 'Acessar Sistema'} {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">OficinaControl v2.0</div>
      </div>
    </div>
  );
};

// --- Aplicação Principal ---

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('production');
  const [batches, setBatches] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  
  const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);

  // Modais
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditReturnModalOpen, setIsEditReturnModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedReturnIndex, setSelectedReturnIndex] = useState(null);

  // Filtros
  const [dashFilters, setDashFilters] = useState({ collection: '', fabric: '', workshop: '' });
  const [dashPeriod, setDashPeriod] = useState('all'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [perfSearch, setPerfSearch] = useState('');
  const [perfSort, setPerfSort] = useState('volume_desc');
  const [prodFilters, setProdFilters] = useState({ collection: '', workshop: '', dateSent: '', dateExpected: '' });
  const [prodSort, setProdSort] = useState('created_desc');
  const [showOnlyLate, setShowOnlyLate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        if (u.email === ADMIN_EMAIL) setActiveTab('dashboard');
        else setActiveTab('production');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'production_batches');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dateSent: doc.data().dateSent?.toDate(),
        dateExpected: doc.data().dateExpected?.toDate(),
        returns: doc.data().returns?.map(r => ({ ...r, date: r.date?.toDate() })) || []
      }));
      setBatches(data);
      setDataLoading(false);
    }, (error) => { console.error("Erro:", error); setDataLoading(false); });
    return () => unsubscribe();
  }, [user]);

  // --- Auth Actions ---
  const handleLogin = async (email, password) => {
    setLoginError(''); setAuthLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (error) { setLoginError("Falha no login. Verifique suas credenciais."); setAuthLoading(false); }
  };
  const handleLogout = async () => { await signOut(auth); setActiveTab('production'); };

  // --- Excel Export ---
  const handleExportExcel = () => {
    if (!window.XLSX) { alert("Carregando biblioteca... Aguarde."); return; }
    const dataToExport = batches.map(b => {
      let lastDeliveryDate = '';
      if (b.returns && b.returns.length > 0) {
        const sortedReturns = [...b.returns].sort((a, b) => b.date - a.date);
        if (sortedReturns[0]?.date) lastDeliveryDate = formatDateForInput(sortedReturns[0].date);
      }
      return {
        Colecao: b.collectionName, Oficina: b.workshop, Ref: b.ref, Preco_Unit: b.price, Tecido: b.fabricType,
        Qtd_Enviada: b.quantitySent, Data_Saida: b.dateSent ? formatDateForInput(b.dateSent) : '',
        Previsao_Entrada: b.dateExpected ? formatDateForInput(b.dateExpected) : '', Data_Ultima_Entrega: lastDeliveryDate,
        Status: b.status, Total_Recebido: b.totalReceived, Total_Perda: b.totalWaste, Falta: b.quantitySent - b.totalReceived - b.totalWaste
      };
    });
    const worksheet = window.XLSX.utils.json_to_sheet(dataToExport);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, "Cortes");
    window.XLSX.writeFile(workbook, `Controle_Oficinas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportClick = () => fileInputRef.current.click();
  
  // --- IMPORTAÇÃO ROBUSTA ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = window.XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = window.XLSX.utils.sheet_to_json(ws);

      if (confirm(`Encontrados ${data.length} registros. Deseja importar?`)) {
        let count = 0;
        let errors = 0;
        
        for (const row of data) {
          try {
            // Normalização Agressiva das chaves (remove _, espaços e lowercase)
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
              const cleanKey = key.toString().trim().toLowerCase().replace(/[_\s]/g, '');
              normalizedRow[cleanKey] = row[key];
            });

            // Validação mínima
            if (!normalizedRow['colecao'] || !normalizedRow['oficina'] || !normalizedRow['ref']) {
              console.warn("Linha pulada - dados incompletos:", row);
              continue;
            }

            const dateSent = parseDate(normalizedRow['datasaida']);
            const dateExpected = parseDate(normalizedRow['previsaoentrada']);
            
            // Leitura segura dos recebidos
            const totalReceived = parseInt(normalizedRow['totalrecebido'] || 0, 10);
            const totalWaste = parseInt(normalizedRow['totalperda'] || 0, 10);
            const statusImported = normalizedRow['status'];
            const lastDeliveryDateRaw = normalizedRow['dataultimaentrega'];
            
            // Gerar histórico se houver recebimento
            const returns = [];
            if (totalReceived > 0 || totalWaste > 0) {
              const deliveryDate = lastDeliveryDateRaw ? parseDate(lastDeliveryDateRaw) : new Date();
              returns.push({
                id: `import-${Date.now()}-${Math.random()}`,
                quantity: totalReceived,
                waste: totalWaste,
                date: Timestamp.fromDate(deliveryDate),
                notes: 'IMPORTADO VIA EXCEL'
              });
            }

            const qtdEnviada = parseInt(normalizedRow['qtdenviada'] || 0, 10);
            let finalStatus = 'Pendente';
            
            if (statusImported) {
               // Mapeia para status válidos ou mantem o da planilha
               finalStatus = statusImported;
            } else {
               const missing = qtdEnviada - totalReceived - totalWaste;
               if (missing <= 0) finalStatus = 'Concluído';
               else if (totalReceived > 0) finalStatus = 'Parcial';
            }

            const newBatch = {
              collectionName: String(normalizedRow['colecao']).toUpperCase(),
              workshop: String(normalizedRow['oficina']).toUpperCase(),
              ref: String(normalizedRow['ref']).toUpperCase(),
              price: parseFloat(normalizedRow['precounit'] || 0).toFixed(2),
              fabricType: String(normalizedRow['tecido'] || 'OUTRO').toUpperCase(),
              quantitySent: qtdEnviada,
              dateSent: Timestamp.fromDate(dateSent),
              dateExpected: Timestamp.fromDate(dateExpected),
              
              status: finalStatus,
              totalReceived: totalReceived,
              totalWaste: totalWaste,
              returns: returns,
              
              createdAt: Timestamp.now()
            };

            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'production_batches'), newBatch);
            count++;
          } catch (err) { 
            console.error("Erro ao importar linha:", row, err);
            errors++;
          }
        }
        alert(`${count} cortes importados com sucesso! ${errors > 0 ? `(${errors} erros)` : ''}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setActiveTab('production');
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- Logic ---
  const recalculateBatchStatus = (batch, updatedReturns) => {
    const totalReceived = updatedReturns.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalWaste = updatedReturns.reduce((acc, curr) => acc + (curr.waste || 0), 0);
    const missing = batch.quantitySent - totalReceived - totalWaste;
    let status = 'Parcial';
    if (missing <= 0) status = 'Concluído'; else if (totalReceived === 0) status = 'Pendente';
    return { returns: updatedReturns, totalReceived, totalWaste, status };
  };

  const handleAddBatch = async (e) => { e.preventDefault(); const f = new FormData(e.target); const b = { collectionName: f.get('collectionName').toUpperCase(), workshop: f.get('workshop').toUpperCase(), ref: f.get('ref').toUpperCase(), price: parseFloat(f.get('price')).toFixed(2), fabricType: f.get('fabricType').toUpperCase(), quantitySent: parseInt(f.get('quantitySent')), dateSent: Timestamp.fromDate(parseDate(f.get('dateSent'))), dateExpected: Timestamp.fromDate(parseDate(f.get('dateExpected'))), status: 'Pendente', totalReceived: 0, totalWaste: 0, returns: [], createdAt: Timestamp.now() }; try { await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'production_batches'), b); e.target.reset(); alert('Salvo!'); setActiveTab('production'); } catch { alert('Erro.'); } };
  const handleUpdateBatch = async (e) => { e.preventDefault(); if (!selectedBatch) return; const f = new FormData(e.target); const b = { collectionName: f.get('collectionName').toUpperCase(), workshop: f.get('workshop').toUpperCase(), ref: f.get('ref').toUpperCase(), price: parseFloat(f.get('price')).toFixed(2), fabricType: f.get('fabricType').toUpperCase(), quantitySent: parseInt(f.get('quantitySent')), dateSent: Timestamp.fromDate(parseDate(f.get('dateSent'))), dateExpected: Timestamp.fromDate(parseDate(f.get('dateExpected'))) }; const s = recalculateBatchStatus({ ...selectedBatch, quantitySent: b.quantitySent }, selectedBatch.returns); try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'production_batches', selectedBatch.id), { ...b, ...s }); setIsEditModalOpen(false); setSelectedBatch(null); } catch { alert('Erro.'); } };
  const handleAddReturn = async (e) => { e.preventDefault(); if (!selectedBatch) return; const f = new FormData(e.target); const r = { id: Date.now().toString(), quantity: parseInt(f.get('qtyReceived')) || 0, waste: parseInt(f.get('waste')) || 0, date: Timestamp.fromDate(parseDate(f.get('returnDate'))), notes: f.get('notes').toUpperCase() }; const u = recalculateBatchStatus(selectedBatch, [...selectedBatch.returns, r]); try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'production_batches', selectedBatch.id), u); setIsReceiveModalOpen(false); setSelectedBatch(null); } catch { alert('Erro.'); } };
  const handleUpdateReturn = async (e) => { e.preventDefault(); if (!selectedBatch || selectedReturnIndex === null) return; const f = new FormData(e.target); const uR = { ...selectedBatch.returns[selectedReturnIndex], quantity: parseInt(f.get('qtyReceived')) || 0, waste: parseInt(f.get('waste')) || 0, date: Timestamp.fromDate(parseDate(f.get('returnDate'))), notes: f.get('notes').toUpperCase() }; const newR = [...selectedBatch.returns]; newR[selectedReturnIndex] = uR; const u = recalculateBatchStatus(selectedBatch, newR); try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'production_batches', selectedBatch.id), u); setIsEditReturnModalOpen(false); setSelectedBatch(null); setSelectedReturnIndex(null); } catch { alert('Erro.'); } };
  const handleDeleteReturn = async (b, i) => { if (!confirm('Excluir entrega?')) return; const newR = b.returns.filter((_, idx) => idx !== i); const u = recalculateBatchStatus(b, newR); try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'production_batches', b.id), u); } catch { alert('Erro.'); } };
  const handleDelete = async (id) => { if (confirm('Excluir registro?')) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'production_batches', id)); };
  const handleUpperCaseInput = (e) => e.target.value = e.target.value.toUpperCase();

  // --- Data & Filters ---
  const uniqueCollections = useMemo(() => [...new Set(batches.map(b => b.collectionName))].sort(), [batches]);
  const uniqueWorkshops = useMemo(() => [...new Set(batches.map(b => b.workshop))].sort(), [batches]);
  const uniqueFabrics = useMemo(() => [...new Set(batches.map(b => b.fabricType))].sort(), [batches]);

  const dashboardData = useMemo(() => {
    const now = new Date();
    let dS = null, dE = null;
    const y = now.getFullYear(), m = now.getMonth();
    if (dashPeriod === 'thisMonth') { dS = new Date(y, m, 1); dE = new Date(y, m + 1, 0); }
    else if (dashPeriod === 'lastMonth') { dS = new Date(y, m - 1, 1); dE = new Date(y, m, 0); }
    else if (dashPeriod === 'thisYear') { dS = new Date(y, 0, 1); dE = new Date(y, 11, 31); }
    else if (dashPeriod === 'custom') { dS = customRange.start ? new Date(customRange.start) : null; dE = customRange.end ? new Date(customRange.end) : null; }

    const matches = (b) => (dashFilters.collection ? b.collectionName === dashFilters.collection : true) && (dashFilters.fabric ? b.fabricType === dashFilters.fabric : true) && (dashFilters.workshop ? b.workshop === dashFilters.workshop : true);
    
    let sent=0, rcv=0, val=0, lateBatches=0, latePieces=0, waste=0, pendP=0, pendB=0;
    const rcvBatches = new Set();
    const wStats = {};

    batches.forEach(b => {
      if (!matches(b)) return;
      const isSent = dashPeriod === 'all' ? true : isDateInRange(b.dateSent, dS, dE);
      if (isSent) {
        sent += b.quantitySent || 0;
        const pQty = (b.quantitySent - (b.totalReceived + (b.totalWaste || 0)));
        if (pQty > 0) {
          val += pQty * parseFloat(b.price); pendP += pQty; pendB++;
          if (b.dateExpected && b.dateExpected < now && b.status !== 'Concluído') { lateBatches++; latePieces += pQty; }
        }
      }
      b.returns.forEach(r => {
        const isRet = dashPeriod === 'all' ? true : isDateInRange(r.date, dS, dE);
        if (isRet) {
          rcv += r.quantity; waste += r.waste; rcvBatches.add(b.id);
          if (!wStats[b.workshop]) wStats[b.workshop] = { count: 0, totalDays: 0, items: 0, batches: new Set() };
          wStats[b.workshop].items += r.quantity; wStats[b.workshop].batches.add(b.id);
          if (b.dateSent && r.date) { const days = Math.max(1, Math.ceil(Math.abs(r.date - b.dateSent) / 86400000)); wStats[b.workshop].count++; wStats[b.workshop].totalDays += days; }
        }
      });
    });

    const ranking = Object.entries(wStats).map(([name, d]) => ({ name, avgDays: d.count > 0 ? (d.totalDays / d.count).toFixed(1) : 'N/A', volume: d.items, uniqueBatches: d.batches.size }));
    const filteredRanking = ranking.filter(i => i.name.toUpperCase().includes(perfSearch.toUpperCase())).sort((a, b) => {
      if (perfSort === 'volume_desc') return b.volume - a.volume;
      if (perfSort === 'speed_asc') return (parseFloat(a.avgDays)||999) - (parseFloat(b.avgDays)||999);
      if (perfSort === 'batches_desc') return b.uniqueBatches - a.uniqueBatches;
      return a.name.localeCompare(b.name);
    });
    
    return { sent, rcv, receivedBatchesCount: rcvBatches.size, pendP, pendB, waste, val, avgVal: pendP > 0 ? (val/pendP) : 0, lateBatches, latePieces, ranking: filteredRanking };
  }, [batches, dashFilters, dashPeriod, customRange, perfSearch, perfSort]);

  const filteredProduction = useMemo(() => {
    let r = batches.filter(b => (prodFilters.workshop ? b.workshop === prodFilters.workshop : true) && (prodFilters.collection ? b.collectionName === prodFilters.collection : true) && (prodFilters.dateSent ? formatDateForInput(b.dateSent) === prodFilters.dateSent : true) && (prodFilters.dateExpected ? formatDateForInput(b.dateExpected) === prodFilters.dateExpected : true) && (searchTerm ? (b.ref.includes(searchTerm.toUpperCase()) || b.workshop.includes(searchTerm.toUpperCase())) : true) && (showOnlyLate ? (b.dateExpected && new Date() > b.dateExpected && b.status !== 'Concluído') : true));
    r.sort((a, b) => {
      if (prodSort === 'created_desc') return b.createdAt - a.createdAt;
      const dA_S = a.dateSent || new Date(0), dB_S = b.dateSent || new Date(0);
      const dA_E = a.dateExpected || new Date(0), dB_E = b.dateExpected || new Date(0);
      if (prodSort === 'sent_asc') return dA_S - dB_S; if (prodSort === 'sent_desc') return dB_S - dA_S;
      if (prodSort === 'exp_asc') return dA_E - dB_E; if (prodSort === 'exp_desc') return dB_E - dA_E;
      return 0;
    });
    return r;
  }, [batches, prodFilters, searchTerm, prodSort, showOnlyLate]);

  if (authLoading) return <div className="flex items-center justify-center h-screen bg-slate-50 text-emerald-600">Carregando...</div>;
  if (!user) return <LoginScreen onLogin={handleLogin} loading={authLoading} error={loginError} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0" style={{ colorScheme: 'light' }}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" style={{ display: 'none' }} />

      <nav className="bg-white text-slate-900 p-4 sticky top-0 z-20 shadow-sm border-b border-slate-200 w-full" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2 font-bold text-xl">
            <Scissors className="w-6 h-6 text-emerald-600" />
            <span>Oficina<span className="text-emerald-500">Control</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex space-x-6 mr-4">
              {isAdmin && <button onClick={() => setActiveTab('dashboard')} className={`hover:text-emerald-600 transition ${activeTab === 'dashboard' ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}>Dashboard</button>}
              <button onClick={() => setActiveTab('production')} className={`hover:text-emerald-600 transition ${activeTab === 'production' ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}>Produção Ativa</button>
              <button onClick={() => setActiveTab('input')} className={`hover:text-emerald-600 transition ${activeTab === 'input' ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}>Novo Corte</button>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-xs text-slate-500 hidden sm:inline">{user.email}</span>
              <button onClick={handleLogout} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-slate-50 transition shadow-sm" style={{ backgroundColor: '#ffffff' }} title="Sair"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-30 shadow-lg pb-safe" style={{ backgroundColor: '#ffffff' }}>
        {isAdmin && <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center text-xs ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}><TrendingUp className="w-6 h-6 mb-1" /> Dashboard</button>}
        <button onClick={() => setActiveTab('production')} className={`flex flex-col items-center text-xs ${activeTab === 'production' ? 'text-emerald-600' : 'text-slate-400'}`}><Package className="w-6 h-6 mb-1" /> Produção</button>
        <button onClick={() => setActiveTab('input')} className={`flex flex-col items-center text-xs ${activeTab === 'input' ? 'text-emerald-600' : 'text-slate-400'}`}><Plus className="w-6 h-6 mb-1" /> Novo</button>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full">
        {activeTab === 'dashboard' && isAdmin && (
          <div className="space-y-6 animate-fade-in w-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                  <div className="flex gap-2">
                    <button onClick={handleExportExcel} className="bg-white border border-emerald-200 text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 transition flex items-center gap-1 text-sm font-bold shadow-sm" style={{ backgroundColor: '#ffffff' }}><Download className="w-4 h-4" /> <span className="hidden sm:inline">Exportar</span></button>
                    <button onClick={handleImportClick} className="bg-white border border-blue-200 text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition flex items-center gap-1 text-sm font-bold shadow-sm" style={{ backgroundColor: '#ffffff' }}><Upload className="w-4 h-4" /> <span className="hidden sm:inline">Importar</span></button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full" style={{ backgroundColor: '#ffffff' }}>
                    {[{ id: 'all', label: 'Geral' }, { id: 'thisMonth', label: 'Este Mês' }, { id: 'lastMonth', label: 'Mês Passado' }, { id: 'thisYear', label: 'Este Ano' }, { id: 'custom', label: 'Outro' }].map((p) => (
                      <button key={p.id} onClick={() => setDashPeriod(p.id)} className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition border ${dashPeriod === p.id ? 'bg-emerald-100 text-emerald-700 border-emerald-100' : 'bg-white text-slate-600 border-transparent hover:border-slate-200 hover:bg-slate-50'}`} style={dashPeriod !== p.id ? { backgroundColor: '#ffffff' } : {}}>{p.label}</button>
                    ))}
                  </div>
                  {dashPeriod === 'custom' && (
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                       <input type="date" value={customRange.start} onChange={(e) => setCustomRange({...customRange, start: e.target.value})} className="p-1 border-0 rounded text-xs bg-transparent text-slate-900 focus:ring-0" style={{ backgroundColor: '#ffffff' }} />
                       <span className="text-slate-400">-</span>
                       <input type="date" value={customRange.end} onChange={(e) => setCustomRange({...customRange, end: e.target.value})} className="p-1 border-0 rounded text-xs bg-transparent text-slate-900 focus:ring-0" style={{ backgroundColor: '#ffffff' }} />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 text-sm">
                <select className="p-2 pr-10 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white text-slate-900 shadow-sm truncate max-w-[200px]" style={{ backgroundColor: '#ffffff' }} value={dashFilters.collection} onChange={e => setDashFilters({...dashFilters, collection: e.target.value})}>
                  <option value="">Todas Coleções</option>{uniqueCollections.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="p-2 pr-10 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white text-slate-900 shadow-sm truncate max-w-[200px]" style={{ backgroundColor: '#ffffff' }} value={dashFilters.fabric} onChange={e => setDashFilters({...dashFilters, fabric: e.target.value})}>
                  <option value="">Todos Tecidos</option>{uniqueFabrics.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select className="p-2 pr-10 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white text-slate-900 shadow-sm truncate max-w-[200px]" style={{ backgroundColor: '#ffffff' }} value={dashFilters.workshop} onChange={e => setDashFilters({...dashFilters, workshop: e.target.value})}>
                  <option value="">Todas Oficinas</option>{uniqueWorkshops.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <Card className="p-4 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Na Rua (Valor)</p><h3 className="text-xl font-bold text-slate-800 mt-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.val)}</h3><p className="text-[10px] text-blue-600 mt-1 font-medium">Média: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.avgVal)} / peça</p></div><DollarSign className="w-6 h-6 text-blue-100" />
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start">
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Peças Pendentes</p><h3 className="text-xl font-bold text-slate-800 mt-1">{dashboardData.pendP}</h3><p className="text-[10px] text-amber-600">Em {dashboardData.pendB} cortes</p></div><Package className="w-6 h-6 text-amber-100" />
                </div>
              </Card>
               <Card className="p-4 border-l-4 border-l-red-400">
                <div className="flex justify-between items-start">
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Total Perdas</p><h3 className="text-xl font-bold text-red-500 mt-1">{dashboardData.waste}</h3><p className="text-[10px] text-red-400">Baixadas no período</p></div><Trash2 className="w-6 h-6 text-red-100" />
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-l-red-600">
                <div className="flex justify-between items-start">
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Peças Atrasadas</p><h3 className="text-xl font-bold text-red-700 mt-1">{dashboardData.latePieces}</h3><p className="text-[10px] text-red-500">Em {dashboardData.lateBatches} cortes</p></div><AlertCircle className="w-6 h-6 text-red-100" />
                </div>
              </Card>
              <Card className="p-4 border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start">
                  <div><p className="text-xs text-slate-500 font-bold uppercase">Recebidas (Boas)</p><h3 className="text-xl font-bold text-emerald-600 mt-1">{dashboardData.rcv}</h3><p className="text-[10px] text-emerald-600">Em {dashboardData.receivedBatchesCount} cortes</p></div><CheckCircle className="w-6 h-6 text-emerald-100" />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-slate-400" /> Performance</h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                   <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input type="text" placeholder="Buscar Oficina..." value={perfSearch} onChange={(e) => setPerfSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:outline-emerald-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
                   <div className="relative"><ListFilter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><select className="pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm w-full focus:outline-emerald-500 bg-white appearance-none text-slate-900" style={{ backgroundColor: '#ffffff' }} value={perfSort} onChange={(e) => setPerfSort(e.target.value)}><option value="volume_desc">Maior Volume</option><option value="batches_desc">Mais Cortes</option><option value="speed_asc">Mais Rápido</option><option value="name_asc">Nome (A-Z)</option></select></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-2 rounded-l-lg">Oficina</th><th className="px-4 py-2">Tempo Médio (Dias)</th><th className="px-4 py-2">Cortes Movimentados</th><th className="px-4 py-2 rounded-r-lg">Peças Entregues</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{dashboardData.ranking.length > 0 ? dashboardData.ranking.map((oficina, idx) => (<tr key={idx} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium">{oficina.name}</td><td className="px-4 py-3">{oficina.avgDays}</td><td className="px-4 py-3 font-medium text-slate-600">{oficina.uniqueBatches}</td><td className="px-4 py-3 font-bold text-emerald-700">{oficina.volume}</td></tr>)) : (<tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">Nenhuma entrega encontrada.</td></tr>)}</tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* --- VIEW: NOVO CORTE --- */}
        {activeTab === 'input' && (
          <div className="max-w-4xl mx-auto animate-fade-in w-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Registrar Saída de Corte</h2>
            <Card className="p-6 md:p-8">
              <form onSubmit={handleAddBatch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Coleção</label><input name="collectionName" onInput={handleUpperCaseInput} required placeholder="EX: INVERNO 26" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase" style={{ backgroundColor: '#ffffff' }} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Oficina</label><input name="workshop" onInput={handleUpperCaseInput} required placeholder="EX: OFICINA MARIA" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase" style={{ backgroundColor: '#ffffff' }} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Referência (Ref)</label><input name="ref" onInput={handleUpperCaseInput} required placeholder="EX: 12345" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase" style={{ backgroundColor: '#ffffff' }} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Preço (R$)</label><div className="relative"><span className="absolute left-3 top-2 text-slate-500">R$</span><input name="price" type="number" step="0.01" required placeholder="3.50" className="w-full p-2 pl-9 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" style={{ backgroundColor: '#ffffff' }} onBlur={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) e.target.value = val.toFixed(2); }} /></div></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Tecido</label><select name="fabricType" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" style={{ backgroundColor: '#ffffff' }}><option value="M">MALHA (M)</option><option value="P">PLANO (P)</option><option value="Outro">OUTRO</option></select></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Quantidade Enviada</label><input name="quantitySent" type="number" required placeholder="560" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" style={{ backgroundColor: '#ffffff' }} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Data Saída</label><input name="dateSent" type="date" required defaultValue={formatDateForInput(new Date())} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" style={{ backgroundColor: '#ffffff' }} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Previsão Entrega</label><input name="dateExpected" type="date" required className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none" style={{ backgroundColor: '#ffffff' }} /></div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center gap-2"><Save className="w-4 h-4" /> Registrar Corte</button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* --- VIEW: PRODUÇÃO (LISTA) --- */}
        {activeTab === 'production' && (
          <div className="space-y-6 animate-fade-in w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <h2 className="text-2xl font-bold text-slate-800">Cortes em Produção</h2>
              
              <div className="w-full md:w-auto flex flex-col gap-3 items-end">
                <div className="flex gap-2 w-full md:w-auto">
                   <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Buscar Ref ou Oficina..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-emerald-500 bg-white text-slate-900 text-sm" style={{ backgroundColor: '#ffffff' }} />
                  </div>
                  <button onClick={() => setShowOnlyLate(!showOnlyLate)} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition border ${showOnlyLate ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`} style={!showOnlyLate ? { backgroundColor: '#ffffff' } : {}}><AlertCircle className="w-4 h-4" /> <span className="hidden md:inline">Apenas Atrasados</span></button>
                </div>

                <div className="w-full md:w-auto bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex flex-wrap gap-2 items-end" style={{ backgroundColor: '#ffffff' }}>
                   <div className="flex flex-col">
                     <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Ordenar Por</label>
                     <div className="relative">
                       <select className="pl-7 p-1.5 pr-8 border border-slate-300 rounded text-sm focus:outline-emerald-500 bg-slate-50 w-40 text-slate-900" style={{ backgroundColor: '#ffffff' }} value={prodSort} onChange={e => setProdSort(e.target.value)}><option value="created_desc">Mais Recente (Cadastro)</option><option value="sent_desc">Data Envio (Decresc)</option><option value="sent_asc">Data Envio (Cresc)</option><option value="exp_asc">Previsão (Cresc)</option><option value="exp_desc">Previsão (Decresc)</option></select>
                        <ArrowUpDown className="absolute left-2 top-2 w-3 h-3 text-slate-400" />
                     </div>
                   </div>
                   <div className="flex flex-col min-w-[120px]">
                     <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Coleção</label>
                     <select className="p-1.5 pr-8 border border-slate-300 rounded text-sm focus:outline-emerald-500 bg-slate-50 text-slate-900 truncate max-w-[150px]" style={{ backgroundColor: '#ffffff' }} value={prodFilters.collection} onChange={e => setProdFilters({...prodFilters, collection: e.target.value})}><option value="">Todas</option>{uniqueCollections.map(c => <option key={c} value={c}>{c}</option>)}</select>
                   </div>
                   <div className="flex flex-col min-w-[120px]">
                     <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Oficina</label>
                     <select className="p-1.5 pr-8 border border-slate-300 rounded text-sm focus:outline-emerald-500 bg-slate-50 text-slate-900 truncate max-w-[150px]" style={{ backgroundColor: '#ffffff' }} value={prodFilters.workshop} onChange={e => setProdFilters({...prodFilters, workshop: e.target.value})}><option value="">Todas</option>{uniqueWorkshops.map(w => <option key={w} value={w}>{w}</option>)}</select>
                   </div>
                   {(prodFilters.workshop || prodFilters.collection || prodFilters.dateSent || prodFilters.dateExpected || searchTerm || showOnlyLate) && (
                     <button onClick={() => { setProdFilters({collection: '', workshop: '', dateSent: '', dateExpected: ''}); setSearchTerm(''); setShowOnlyLate(false); setProdSort('created_desc'); }} className="self-center ml-2 text-xs text-red-500 hover:bg-red-50 p-2 rounded flex items-center gap-1"><X className="w-3 h-3" /> Limpar</button>
                   )}
                </div>
              </div>
            </div>
            
            <div className="grid gap-4">
              {filteredProduction.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300" style={{ backgroundColor: '#ffffff' }}><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhum corte encontrado.</p></div>
              ) : (
                filteredProduction.map((batch) => {
                  const pending = batch.quantitySent - (batch.totalReceived || 0) - (batch.totalWaste || 0);
                  const isLate = batch.dateExpected && new Date() > batch.dateExpected && batch.status !== 'Concluído';
                  return (
                    <Card key={batch.id} className="overflow-hidden">
                      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1"><h3 className="text-lg font-bold text-slate-800">Ref: {batch.ref}</h3><Badge status={isLate ? 'Atrasado' : batch.status} /><span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{batch.collectionName}</span></div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600"><span className="flex items-center gap-1 font-medium"><Scissors className="w-3 h-3 text-emerald-600" /> {batch.workshop}</span><span className="flex items-center gap-1"><ArrowRight className="w-3 h-3 text-blue-500" /> Enviado: {batch.dateSent ? batch.dateSent.toLocaleDateString('pt-BR') : 'N/A'}</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> Prev: {batch.dateExpected ? batch.dateExpected.toLocaleDateString('pt-BR') : 'N/A'}</span><span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(batch.price)}/un</span></div>
                        </div>
                        <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="text-center"><div className="text-xs text-slate-400 uppercase font-bold">Enviado</div><div className="font-bold text-slate-700">{batch.quantitySent}</div></div><div className="w-px h-8 bg-slate-200"></div>
                          <div className="text-center"><div className="text-xs text-emerald-600 uppercase font-bold">Entregue</div><div className="font-bold text-emerald-600">{batch.totalReceived}</div></div><div className="text-center"><div className="text-xs text-red-400 uppercase font-bold">Perda</div><div className="font-bold text-red-500">{batch.totalWaste || 0}</div></div><div className="w-px h-8 bg-slate-200"></div>
                          <div className="text-center"><div className="text-xs text-amber-500 uppercase font-bold">Falta</div><div className="font-bold text-amber-600">{Math.max(0, pending)}</div></div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedBatch(batch); setIsReceiveModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={batch.status === 'Concluído'} title="Dar Baixa"><Truck className="w-5 h-5" /></button>
                          <button onClick={() => { setSelectedBatch(batch); setIsEditModalOpen(true); }} className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-lg transition" title="Editar"><Pencil className="w-5 h-5" /></button>
                          <button onClick={() => handleDelete(batch.id)} className="bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 p-2 rounded-lg transition" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                      {batch.returns && batch.returns.length > 0 && (
                        <div className="bg-slate-50 p-4 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Histórico de Entregas</h4>
                          <div className="space-y-2">{batch.returns.map((ret, idx) => (<div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-200 shadow-sm hover:bg-slate-50 transition group" style={{ backgroundColor: '#ffffff' }}><div className="flex items-center gap-4"><span className="text-slate-600 min-w-[80px]">{ret.date ? ret.date.toLocaleDateString('pt-BR') : 'Data desc.'}</span><span className="text-emerald-600 font-medium">+{ret.quantity} pçs</span>{ret.waste > 0 && <span className="text-red-500 text-xs flex items-center">({ret.waste} perda)</span>}{ret.notes && <span className="text-slate-400 text-xs italic hidden md:inline">- {ret.notes}</span>}</div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setSelectedBatch(batch); setSelectedReturnIndex(idx); setIsEditReturnModalOpen(true); }} className="p-1 hover:bg-blue-100 text-blue-600 rounded"><Pencil className="w-3 h-3" /></button><button onClick={() => handleDeleteReturn(batch, idx)} className="p-1 hover:bg-red-100 text-red-600 rounded"><Trash2 className="w-3 h-3" /></button></div></div>))}</div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modais */}
      {isReceiveModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in" style={{ backgroundColor: '#ffffff' }}>
            <div className="bg-emerald-600 p-4 flex justify-between items-center text-white"><h3 className="font-bold text-lg">Receber Mercadoria</h3><button onClick={() => setIsReceiveModalOpen(false)} className="hover:bg-emerald-700 p-1 rounded"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAddReturn} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 mb-4"><p><strong>Ref:</strong> {selectedBatch.ref}</p><p><strong>Pendente:</strong> {selectedBatch.quantitySent - selectedBatch.totalReceived - selectedBatch.totalWaste} peças</p></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Data da Entrada</label><input name="returnDate" type="date" required defaultValue={formatDateForInput(new Date())} className="w-full p-2 border border-slate-300 rounded focus:outline-emerald-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Qtd Entregue</label><input name="qtyReceived" type="number" required min="0" className="w-full p-2 border border-slate-300 rounded focus:outline-emerald-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Perda</label><input name="waste" type="number" min="0" className="w-full p-2 border border-slate-300 rounded focus:outline-emerald-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Obs</label><textarea name="notes" rows="2" onInput={handleUpperCaseInput} className="w-full p-2 border border-slate-300 rounded focus:outline-emerald-500 uppercase bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }}></textarea></div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition">Confirmar</button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedBatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in" style={{ backgroundColor: '#ffffff' }}>
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white"><h3 className="font-bold text-lg">Editar Corte</h3><button onClick={() => setIsEditModalOpen(false)} className="hover:bg-blue-700 p-1 rounded"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleUpdateBatch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium text-slate-700 mb-1">Coleção</label><input name="collectionName" defaultValue={selectedBatch.collectionName} onInput={handleUpperCaseInput} required className="w-full p-2 border border-slate-300 rounded uppercase focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
                 <div><label className="block text-sm font-medium text-slate-700 mb-1">Oficina</label><input name="workshop" defaultValue={selectedBatch.workshop} onInput={handleUpperCaseInput} required className="w-full p-2 border border-slate-300 rounded uppercase focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
                 <div><label className="block text-sm font-medium text-slate-700 mb-1">Ref</label><input name="ref" defaultValue={selectedBatch.ref} onInput={handleUpperCaseInput} required className="w-full p-2 border border-slate-300 rounded uppercase focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
                 <div><label className="block text-sm font-medium text-slate-700 mb-1">Preço</label><input name="price" type="number" step="0.01" defaultValue={selectedBatch.price} required className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
                 <div><label className="block text-sm font-medium text-slate-700 mb-1">Tecido</label><select name="fabricType" defaultValue={selectedBatch.fabricType} className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }}><option value="M">MALHA (M)</option><option value="P">PLANO (P)</option><option value="Outro">OUTRO</option></select></div>
                 <div><label className="block text-sm font-medium text-slate-700 mb-1">Qtd</label><input name="quantitySent" type="number" defaultValue={selectedBatch.quantitySent} required className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
                 <div><label className="block text-sm font-medium text-slate-700 mb-1">Saída</label><input name="dateSent" type="date" defaultValue={formatDateForInput(selectedBatch.dateSent)} required className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
                 <div><label className="block text-sm font-medium text-slate-700 mb-1">Previsão</label><input name="dateExpected" type="date" defaultValue={formatDateForInput(selectedBatch.dateExpected)} required className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
              </div>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition">Salvar</button></div>
            </form>
          </div>
        </div>
      )}

      {isEditReturnModalOpen && selectedBatch && selectedReturnIndex !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in" style={{ backgroundColor: '#ffffff' }}>
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white"><h3 className="font-bold text-lg">Editar Entrada</h3><button onClick={() => {setIsEditReturnModalOpen(false); setSelectedReturnIndex(null);}} className="hover:bg-blue-700 p-1 rounded"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleUpdateReturn} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Data</label><input name="returnDate" type="date" required defaultValue={formatDateForInput(selectedBatch.returns[selectedReturnIndex]?.date)} className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Qtd</label><input name="qtyReceived" type="number" required min="0" defaultValue={selectedBatch.returns[selectedReturnIndex]?.quantity} className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Perda</label><input name="waste" type="number" min="0" defaultValue={selectedBatch.returns[selectedReturnIndex]?.waste} className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }} /></div></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Obs</label><textarea name="notes" rows="2" onInput={handleUpperCaseInput} defaultValue={selectedBatch.returns[selectedReturnIndex]?.notes} className="w-full p-2 border border-slate-300 rounded focus:outline-blue-500 uppercase bg-white text-slate-900" style={{ backgroundColor: '#ffffff' }}></textarea></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">Salvar</button>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        
        /* Regras Forçadas para Tema Claro */
        :root {
          color-scheme: light;
        }
        body {
          background-color: #f8fafc !important; /* Slate-50 */
          color: #0f172a !important; /* Slate-900 */
        }
        input, select, textarea { 
          background-color: #ffffff !important; 
          color: #0f172a !important; 
          border-color: #e2e8f0;
        }
        input::placeholder, textarea::placeholder {
          color: #94a3b8 !important;
        }
        /* Garantir que selects tenham ícone visível e padding correto */
        select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem !important;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
}