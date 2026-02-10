import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Footer from './components/Footer';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ChampionshipDetails from './pages/ChampionshipDetails';
import CreateChampionship from './pages/CreateChampionship';
import CreateTeam from './pages/CreateTeam';
import MatchSheet from './pages/MatchSheet';
import PublicChampionshipDetails from './pages/PublicChampionshipDetails';
import TeamDetails from './pages/TeamDetails';
import PublicTeamDetails from './pages/PublicTeamDetails';
import Teams from './pages/Teams';
import Championships from './pages/Championships';
import api from './services/api';
import { FaTrophy, FaUsers, FaPlusCircle, FaArrowRight, FaCalendarCheck } from 'react-icons/fa';

const Dashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<{ activeChampionships: any[], lastChampion: any }>({ activeChampionships: [], lastChampion: null });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/championships/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data", error);
    }
  };

  const { activeChampionships, lastChampion } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-sans">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-gray-800 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Futkings Logo" className="h-16 w-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-tighter">Futkings Manager</h1>
            <p className="text-gray-400 text-sm">Painel de Controle</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="font-bold text-white">{user?.name}</p>
            <span className="text-xs bg-yellow-900/50 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">{user?.role}</span>
          </div>
          <button onClick={signOut} className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg font-bold transition">Sair</button>
        </div>
      </header>

      {/* Last Champion Spotlight */}
      {lastChampion && (
        <section className="mb-12 animate-fade-in">
          <div className="relative bg-gradient-to-r from-yellow-900/40 to-black rounded-3xl p-1 border border-yellow-500/30 overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/field-texture.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all duration-1000"></div>

            <div className="bg-gray-900/80 backdrop-blur-sm rounded-[20px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                  <FaTrophy /> Último Campeão
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-2 leading-tight">
                  {lastChampion.name}
                </h2>
                <p className="text-xl text-gray-400 flex items-center gap-2 justify-center md:justify-start">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  {lastChampion.championshipName}
                </p>
              </div>

              <div className="relative">
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-700 p-1 shadow-[0_0_50px_rgba(234,179,8,0.4)] animate-pulse-slow">
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden border-4 border-gray-900">
                    {lastChampion.logoUrl ? (
                      <img src={lastChampion.logoUrl} alt={lastChampion.name} className="w-full h-full object-cover" />
                    ) : (
                      <FaTrophy size={80} className="text-yellow-500" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-yellow-500 px-4 py-1 rounded-full font-bold text-sm border border-yellow-500/50 whitespace-nowrap">
                  CAMPEÃO
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Teams Card */}
        <div
          onClick={() => navigate('/teams')}
          className="group bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-yellow-500/50 cursor-pointer transition-all hover:transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FaUsers size={120} />
          </div>
          <div className="relative z-10">
            <div className="bg-blue-900/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FaUsers size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Meus Times</h3>
            <p className="text-gray-400 mb-6">Gerencie elencos, jogadores e transferências.</p>
            <span className="text-blue-400 font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
              Acessar Times <FaArrowRight />
            </span>
          </div>
        </div>

        {/* Championships Card */}
        <div
          onClick={() => navigate('/championships')}
          className="group bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-yellow-500/50 cursor-pointer transition-all hover:transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FaTrophy size={120} />
          </div>
          <div className="relative z-10">
            <div className="bg-yellow-900/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-yellow-500 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
              <FaTrophy size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Campeonatos</h3>
            <p className="text-gray-400 mb-6">Organize campeonatos, tabelas e partidas.</p>
            <span className="text-yellow-500 font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
              Ver Campeonatos <FaArrowRight />
            </span>
          </div>
        </div>

        {/* Quick Match / Create Card */}
        <div
          onClick={() => navigate('/championships/new')}
          className="group bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-green-500/50 cursor-pointer transition-all hover:transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FaPlusCircle size={120} />
          </div>
          <div className="relative z-10">
            <div className="bg-green-900/30 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-green-500 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <FaPlusCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Novo Campeonato</h3>
            <p className="text-gray-400 mb-6">Crie um novo campeonato do zero.</p>
            <span className="text-green-500 font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
              Criar Agora <FaArrowRight />
            </span>
          </div>
        </div>
      </div>

      {/* Active Championships Widget */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-yellow-500">⚡</span> Em Andamento
          </h3>
          {activeChampionships.length > 0 && (
            <Link to="/championships" className="text-sm text-gray-400 hover:text-white transition">Ver todos</Link>
          )}
        </div>

        {activeChampionships.length === 0 ? (
          <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
            <p className="text-gray-500 mb-4">Nenhum campeonato ativo no momento.</p>
            <button onClick={() => navigate('/championships/new')} className="text-yellow-500 font-bold hover:underline">Começar um agora</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeChampionships.map((champ) => (
              <div key={champ.id} onClick={() => navigate(`/championships/${champ.id}`)} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-yellow-500 cursor-pointer transition group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-600 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">
                  ACTIVE
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 overflow-hidden">
                    {champ.logoUrl ? <img src={champ.logoUrl} className="w-full h-full object-cover" /> : <FaTrophy />}
                  </div>
                  <h4 className="font-bold text-lg truncate">{champ.name}</h4>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span className="flex items-center gap-1"><FaCalendarCheck /> {new Date(champ.createdAt).toLocaleDateString()}</span>
                  <span className="text-white group-hover:text-yellow-500 transition">&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signed, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  if (!signed) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

          <Route path="/teams" element={<PrivateRoute><Teams /></PrivateRoute>} />
          <Route path="/championships" element={<PrivateRoute><Championships /></PrivateRoute>} />

          <Route path="/championships/new" element={<PrivateRoute><CreateChampionship /></PrivateRoute>} />
          <Route path="/championships/:id" element={<PrivateRoute><ChampionshipDetails /></PrivateRoute>} />

          <Route path="/teams/new" element={<PrivateRoute><CreateTeam /></PrivateRoute>} />
          <Route path="/teams/:id" element={<PrivateRoute><TeamDetails /></PrivateRoute>} />

          <Route path="/matches/:id/sheet" element={<PrivateRoute><MatchSheet /></PrivateRoute>} />

          {/* Public Routes */}
          <Route path="/c/:id" element={<PublicChampionshipDetails />} />
          <Route path="/t/:id" element={<PublicTeamDetails />} />
          <Route path="/public/teams/:id" element={<PublicTeamDetails />} />
          <Route path="/public/teams/:id" element={<PublicTeamDetails />} />
        </Routes>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
