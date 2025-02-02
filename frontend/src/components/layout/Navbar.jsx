// src/components/Navbar.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import logo from '../assets/logo.svg';

const Navbar = () => {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-dark-secondary shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">

            <div>
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
              <span className="font-bold text-lg text-gray-900 dark:text-white">Sistema de Afilado</span>
            </div>
            
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">{user?.nombre}</p>
              <p className="text-gray-500 dark:text-gray-400">
                {user?.sucursal?.nombre} - {user?.rol}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-accent rounded-full text-gray-600 dark:text-gray-300"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;