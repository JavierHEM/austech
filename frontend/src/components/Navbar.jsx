// src/components/Navbar.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import logo from '../assets/logo.png';
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
          <div className="flex items-center">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-10 w-auto mr-3" // Ajusta el tamaño según necesites
            />
            <span className="font-bold text-lg">Sistema de Afilado</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{user?.nombre}</p>
              <p className="text-gray-500 dark:text-gray-400">{user?.rol}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-accent rounded-full"
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