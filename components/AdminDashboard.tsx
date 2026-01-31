import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Settings, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  Search,
  Filter,
  Sparkles,
  Copy,
  Share2,
  Database,
  Terminal,
  AlertTriangle
} from 'lucide-react';
import { Reservation, MenuItem } from '../types';
import { generateMarketingCopy } from '../services/geminiService';

interface AdminDashboardProps {
  reservations: Reservation[];
  onUpdateStatus: (id: string, status: 'confirmed' | 'cancelled') => void;
  onLogout: () => void;
  menuItems: MenuItem[]; // Need menu items for AI generation
  isDbConnected: boolean;
}

const SQL_COMMAND = `create table reservations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_name text,
  phone text,
  pax int,
  date text,
  time text,
  table_type text,
  status text default 'pending'
);

alter table reservations enable row level security;

create policy "Public Access" on reservations
for all
using (true)
with check (true);`;

const AdminDashboard: React.FC<AdminDashboardProps> = ({ reservations, onUpdateStatus, onLogout, menuItems, isDbConnected }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reservations' | 'marketing'>('overview');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  // AI Marketing State
  const [selectedDishId, setSelectedDishId] = useState<string>('');
  const [marketingTone, setMarketingTone] = useState<'formal' | 'divertido' | 'urgente'>('divertido');
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Stats Calculation
  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    today: reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length
  };

  const filteredReservations = reservations
    .filter(r => filterStatus === 'all' || r.status === filterStatus)
    .sort((a, b) => b.createdAt - a.createdAt); // Newest first

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const handleGenerateCopy = async () => {
    const dish = menuItems.find(i => i.id.toString() === selectedDishId);
    if (!dish) return;

    setIsGenerating(true);
    const text = await generateMarketingCopy(dish.name, dish.description, marketingTone);
    setGeneratedCopy(text);
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCopy);
    alert("Texto copiado!"); // In a real app, use a toast
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_COMMAND);
    alert("Comando SQL copiado! Rode isso no Supabase.");
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans flex animate-in fade-in duration-500">
      
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 border-r border-stone-800 flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-6 border-b border-stone-800">
          <h1 className="font-serif text-2xl font-bold text-white tracking-widest">FUEGO<span className="text-orange-600">.OS</span></h1>
          <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">Manager Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Visão Geral</span>
          </button>
          <button 
            onClick={() => setActiveTab('reservations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reservations' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
          >
            <CalendarDays size={20} />
            <span className="font-medium">Reservas</span>
            {stats.pending > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.pending}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('marketing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'marketing' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
          >
            <Sparkles size={20} />
            <span className="font-medium">Marketing IA</span>
            <span className="ml-auto text-[10px] bg-purple-400/20 text-purple-300 px-1.5 py-0.5 rounded uppercase font-bold">New</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-white transition-all opacity-50 cursor-not-allowed" title="Em breve">
            <Settings size={20} />
            <span className="font-medium">Configurações</span>
          </button>
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-4">
           {/* System Health Indicator */}
           <div className={`rounded-xl p-3 border ${isDbConnected ? 'bg-emerald-900/20 border-emerald-800' : 'bg-red-900/20 border-red-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                 <div className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className={`text-xs font-bold ${isDbConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                   {isDbConnected ? 'Sistema Online' : 'Sistema Offline'}
                 </span>
              </div>
              {!isDbConnected && (
                <button onClick={() => setShowSqlHelp(true)} className="text-[10px] text-red-300 hover:text-white underline decoration-dashed">
                  Configurar Banco de Dados
                </button>
              )}
           </div>

          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:bg-red-900/20 hover:text-red-400 transition-all">
            <LogOut size={20} />
            <span className="font-medium">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        
        {/* SQL Help Modal */}
        {showSqlHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 bg-stone-800 border-b border-stone-700 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <Database className="text-orange-500" /> Configuração do Banco de Dados
                 </h3>
                 <button onClick={() => setShowSqlHelp(false)} className="text-stone-400 hover:text-white"><XCircle /></button>
              </div>
              <div className="p-6">
                <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6 flex gap-3">
                   <AlertTriangle className="text-amber-500 shrink-0" />
                   <p className="text-sm text-amber-200">
                     A sincronização entre dispositivos não está funcionando porque as tabelas do Supabase ainda não existem. 
                     Rode o comando abaixo no <strong>SQL Editor</strong> do Supabase para corrigir.
                   </p>
                </div>
                
                <div className="bg-black rounded-lg border border-stone-800 p-4 mb-6 relative group">
                  <pre className="text-xs md:text-sm font-mono text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                    {SQL_COMMAND}
                  </pre>
                  <button 
                    onClick={copySql}
                    className="absolute top-2 right-2 bg-stone-800 hover:bg-stone-700 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Copy size={14} /> Copiar SQL
                  </button>
                </div>
                
                <div className="flex justify-end">
                   <button onClick={() => setShowSqlHelp(false)} className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 font-bold">Fechar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-white">
              {activeTab === 'overview' ? 'Dashboard' : activeTab === 'marketing' ? 'Marketing Generator' : 'Gerenciar Reservas'}
            </h2>
            <p className="text-stone-500 mt-1">Bem-vindo de volta, Gerente.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-white">Fuego Admin</span>
                <span className="text-xs text-stone-500">Unidade Jardins</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
              <Users size={20} className="text-stone-400" />
            </div>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 hover:border-orange-900/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <CalendarDays size={24} />
                  </div>
                  <span className="text-xs font-bold text-stone-500 bg-stone-800 px-2 py-1 rounded">HOJE</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stats.today}</h3>
                <p className="text-stone-500 text-sm">Reservas para hoje</p>
              </div>

              <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 hover:border-orange-900/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                    <Clock size={24} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stats.pending}</h3>
                <p className="text-stone-500 text-sm">Aguardando aprovação</p>
              </div>

              <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 hover:border-orange-900/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <CheckCircle size={24} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stats.confirmed}</h3>
                <p className="text-stone-500 text-sm">Reservas confirmadas</p>
              </div>

              <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 hover:border-orange-900/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                    <Users size={24} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stats.total}</h3>
                <p className="text-stone-500 text-sm">Total histórico</p>
              </div>
            </div>

            {/* Quick Actions / Recent */}
            <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
              <div className="p-6 border-b border-stone-800 flex justify-between items-center">
                <h3 className="font-bold text-white text-lg">Solicitações Recentes</h3>
                <button onClick={() => setActiveTab('reservations')} className="text-orange-500 text-sm font-bold hover:underline">Ver todas</button>
              </div>
              <div>
                {filteredReservations.slice(0, 5).map(res => (
                  <div key={res.id} className="p-4 border-b border-stone-800 last:border-0 hover:bg-stone-800/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className={`w-2 h-2 rounded-full ${res.status === 'confirmed' ? 'bg-emerald-500' : res.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                       <div>
                         <p className="font-bold text-white">{res.clientName}</p>
                         <p className="text-xs text-stone-500">{res.date} às {res.time} • {res.pax}</p>
                       </div>
                    </div>
                    {res.status === 'pending' && (
                       <div className="flex gap-2">
                         <button onClick={() => onUpdateStatus(res.id, 'confirmed')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors">
                           <CheckCircle size={16} />
                         </button>
                         <button onClick={() => onUpdateStatus(res.id, 'cancelled')} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                           <XCircle size={16} />
                         </button>
                       </div>
                    )}
                  </div>
                ))}
                {filteredReservations.length === 0 && (
                  <div className="p-8 text-center text-stone-500">
                    Nenhuma reserva encontrada. 
                    {!isDbConnected && <span className="text-red-500 block mt-2 text-xs">Atenção: Você está visualizando dados locais offline.</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reservations List Tab */}
        {activeTab === 'reservations' && (
          <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
             <div className="p-6 border-b border-stone-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                  <input type="text" placeholder="Buscar cliente..." className="bg-stone-950 border border-stone-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 w-64" />
                </div>
                <div className="flex gap-2">
                  {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${filterStatus === status ? 'bg-orange-600 text-white' : 'bg-stone-950 text-stone-500 hover:text-white'}`}
                    >
                      {status === 'all' ? 'Todos' : status}
                    </button>
                  ))}
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-stone-950 text-stone-500 text-xs uppercase tracking-wider font-semibold">
                   <tr>
                     <th className="p-4">Cliente</th>
                     <th className="p-4">Contato</th>
                     <th className="p-4">Data & Hora</th>
                     <th className="p-4">Mesa</th>
                     <th className="p-4">Pessoas</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-stone-800">
                   {filteredReservations.map((res) => (
                     <tr key={res.id} className="hover:bg-stone-800/30 transition-colors">
                       <td className="p-4 font-medium text-white">{res.clientName}</td>
                       <td className="p-4 text-stone-400 text-sm">{res.phone}</td>
                       <td className="p-4 text-stone-300 text-sm">
                         {res.date.split('-').reverse().join('/')} <br/> 
                         <span className="text-stone-500">{res.time}</span>
                       </td>
                       <td className="p-4 text-stone-400 text-sm">{res.tableType}</td>
                       <td className="p-4 text-stone-400 text-sm">{res.pax}</td>
                       <td className="p-4">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(res.status)}`}>
                           {res.status.toUpperCase()}
                         </span>
                       </td>
                       <td className="p-4 text-right">
                         {res.status === 'pending' ? (
                           <div className="flex justify-end gap-2">
                             <button onClick={() => onUpdateStatus(res.id, 'confirmed')} className="text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-lg transition-colors" title="Confirmar">
                               <CheckCircle size={18} />
                             </button>
                             <button onClick={() => onUpdateStatus(res.id, 'cancelled')} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors" title="Cancelar">
                               <XCircle size={18} />
                             </button>
                           </div>
                         ) : (
                           <span className="text-xs text-stone-600 italic">Finalizado</span>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {filteredReservations.length === 0 && (
                 <div className="p-12 text-center text-stone-500">
                   <Filter size={48} className="mx-auto mb-4 opacity-20" />
                   <p>Nenhuma reserva encontrada com este filtro.</p>
                   {!isDbConnected && (
                     <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg inline-block">
                        <p className="text-red-400 text-sm">O sistema está usando armazenamento local. Os dados não estão sincronizando.</p>
                        <button onClick={() => setShowSqlHelp(true)} className="text-white underline text-sm mt-1">Clique para corrigir</button>
                     </div>
                   )}
                 </div>
               )}
             </div>
          </div>
        )}

        {/* AI Marketing Tab */}
        {activeTab === 'marketing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-500">
            {/* Input Section */}
            <div className="bg-stone-900 rounded-2xl border border-stone-800 p-8">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Sparkles className="text-purple-500" />
                 Gerador de Posts IA
               </h3>
               
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-semibold text-stone-400 mb-2">Escolha o Prato</label>
                   <select 
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                      value={selectedDishId}
                      onChange={(e) => setSelectedDishId(e.target.value)}
                   >
                     <option value="">Selecione um item do cardápio...</option>
                     {menuItems.map(item => (
                       <option key={item.id} value={item.id}>{item.name}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-semibold text-stone-400 mb-2">Tom da Postagem</label>
                   <div className="grid grid-cols-3 gap-3">
                     <button 
                       onClick={() => setMarketingTone('divertido')}
                       className={`p-3 rounded-lg border text-sm font-medium transition-all ${marketingTone === 'divertido' ? 'bg-purple-600 border-purple-600 text-white' : 'border-stone-700 text-stone-400 hover:bg-stone-800'}`}
                     >
                       😄 Divertido
                     </button>
                     <button 
                        onClick={() => setMarketingTone('formal')}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${marketingTone === 'formal' ? 'bg-purple-600 border-purple-600 text-white' : 'border-stone-700 text-stone-400 hover:bg-stone-800'}`}
                     >
                       👔 Elegante
                     </button>
                     <button 
                        onClick={() => setMarketingTone('urgente')}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${marketingTone === 'urgente' ? 'bg-purple-600 border-purple-600 text-white' : 'border-stone-700 text-stone-400 hover:bg-stone-800'}`}
                     >
                       🔥 Promoção
                     </button>
                   </div>
                 </div>

                 <button 
                    onClick={handleGenerateCopy}
                    disabled={!selectedDishId || isGenerating}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!selectedDishId ? 'bg-stone-800 text-stone-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-[1.02] shadow-lg shadow-purple-900/30'}`}
                 >
                   {isGenerating ? (
                     <>Generating...</>
                   ) : (
                     <>
                       <Sparkles size={18} /> Gerar Legenda Mágica
                     </>
                   )}
                 </button>
               </div>
            </div>

            {/* Output Section */}
            <div className="bg-stone-900 rounded-2xl border border-stone-800 p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6">Preview</h3>
              
              <div className="flex-1 bg-stone-950 rounded-xl border border-stone-800 p-6 relative group">
                {generatedCopy ? (
                  <div className="whitespace-pre-wrap text-stone-300 leading-relaxed">
                    {generatedCopy}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-stone-600 opacity-50">
                    <Sparkles size={48} className="mb-4" />
                    <p>O texto gerado pela IA aparecerá aqui.</p>
                  </div>
                )}
                
                {generatedCopy && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 backdrop-blur rounded-lg p-1">
                    <button onClick={copyToClipboard} className="p-2 hover:text-white text-stone-400 transition-colors" title="Copiar">
                      <Copy size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-between items-center text-xs text-stone-500">
                <p>Powered by Google Gemini 3</p>
                {generatedCopy && <p>{generatedCopy.length} caracteres</p>}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;