import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBusinessStore } from './lib/store';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateBusiness from './pages/CreateBusiness';
import BusinessDetail from './pages/BusinessDetail';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex h-screen bg-gray-950 text-white">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create" element={<CreateBusiness />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="*" element={<div className="p-8">404 - Page not found</div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;