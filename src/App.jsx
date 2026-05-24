import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/query-client';

import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateBusiness from './pages/CreateBusiness';
import BusinessDetail from './pages/BusinessDetail';
import { AuthProvider } from './lib/AuthContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="flex h-screen bg-gray-950 text-white">
            <Sidebar />
            <main className="flex-1 overflow-auto p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create" element={<CreateBusiness />} />
                <Route path="/business/:id" element={<BusinessDetail />} />
                <Route path="*" element={<div>404 - Page not found</div>} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
