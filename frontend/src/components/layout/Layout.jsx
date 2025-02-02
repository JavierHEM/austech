// src/components/Layout.jsx
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Navigate, Outlet } from 'react-router-dom';

const Layout = () => {
 const { user } = useAuth();

 if (!user) return <Navigate to="/login" />;

 return (
   <div className="min-h-screen bg-gray-100 dark:bg-dark-primary">
     <Navbar />
     <div className="flex">
       <Sidebar />
       <main className="flex-1 p-8">
         <Outlet />
       </main>
     </div>
   </div>
 );
};

export default Layout;