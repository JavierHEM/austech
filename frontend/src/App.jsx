// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sucursales from './pages/Sucursales';
import Usuarios from './pages/Usuarios';
import TiposSierra from './pages/TiposSierra';
import Sierras from './pages/Sierras';
import RegistroAfilado from './pages/RegistroAfilado';
import Reportes from './pages/Reportes';

const queryClient = new QueryClient({
 defaultOptions: {
   queries: {
     refetchOnWindowFocus: false,
     retry: 1
   }
 }
});

function App() {
 return (
   <QueryClientProvider client={queryClient}>
     <ThemeProvider>
       <AuthProvider>
         <BrowserRouter>
           <Routes>
             <Route path="/login" element={<Login />} />
             
             <Route element={<ProtectedRoute />}>
               <Route element={<Layout />}>
                 <Route path="/" element={<Navigate to="/dashboard" />} />
                 <Route path="/dashboard" element={<Dashboard />} />
                 <Route path="/sucursales" element={<Sucursales />} />
                 <Route path="/usuarios" element={<Usuarios />} />
                 <Route path="/tipos-sierra" element={<TiposSierra />} />
                 <Route path="/sierras" element={<Sierras />} />
                 <Route path="/registro-afilado" element={<RegistroAfilado />} />
                 <Route path="/reportes" element={<Reportes />} />
               </Route>
             </Route>

             <Route path="*" element={<Navigate to="/" replace />} />
           </Routes>
         </BrowserRouter>
       </AuthProvider>
     </ThemeProvider>
   </QueryClientProvider>
 );
}

export default App;