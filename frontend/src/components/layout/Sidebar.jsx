// src/components/Sidebar.jsx
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Users, Building2, Saw, ClipboardList, 
  BarChart3, Settings 
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['GERENTE', 'JEFE_SUCURSAL', 'OPERADOR'] },
  { path: '/sucursales', icon: Building2, label: 'Sucursales', roles: ['GERENTE'] },
  { path: '/usuarios', icon: Users, label: 'Usuarios', roles: ['GERENTE', 'JEFE_SUCURSAL'] },
  { path: '/tipos-sierra', icon: Settings, label: 'Tipos Sierra', roles: ['GERENTE'] },
  { path: '/sierras', icon: Saw, label: 'Sierras', roles: ['GERENTE', 'JEFE_SUCURSAL'] },
  { path: '/registro-afilado', icon: ClipboardList, label: 'Registro Afilado', roles: ['GERENTE', 'JEFE_SUCURSAL', 'OPERADOR'] },
  { path: '/reportes', icon: BarChart3, label: 'Reportes', roles: ['GERENTE', 'JEFE_SUCURSAL'] }
];

const Sidebar = () => {
  const { hasPermission } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 bg-white dark:bg-dark-secondary shadow-lg min-h-screen">
      <nav className="p-4">
        {menuItems.map(item => {
          if (!hasPermission(item.roles)) return null;

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg mb-1
                ${isActive 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-accent'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;