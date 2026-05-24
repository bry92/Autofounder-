import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/create', label: 'Create Business' },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="font-bold text-2xl tracking-tighter">AUTOfounder</div>
        <div className="text-xs text-emerald-500">24/7 Autonomous</div>
      </div>
      <nav className="flex-1 p-4">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-3 rounded-xl mb-1 ${location.pathname === item.path ? 'bg-white text-black' : 'hover:bg-gray-800'}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}