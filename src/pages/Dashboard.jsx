import React, { useEffect } from 'react';
import { useBusinessStore } from '../lib/store';

export default function Dashboard() {
  const { businesses, aiDecisions, fetchBusinesses, isLoading } = useBusinessStore();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">AutoFounder Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-900 p-6 rounded-xl">
          <div className="text-sm text-gray-400">Active Businesses</div>
          <div className="text-4xl font-bold mt-2">{businesses.length}</div>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl">
          <div className="text-sm text-gray-400">AI Decisions Today</div>
          <div className="text-4xl font-bold mt-2">{aiDecisions.length}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Your Businesses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {businesses.map(biz => (
          <div key={biz.id} className="bg-gray-900 p-6 rounded-xl">
            <h3 className="font-medium">{biz.name}</h3>
            <div className="text-sm text-emerald-400 mt-1">{biz.status}</div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-12 mb-4">Recent AI Decisions</h2>
      <div className="space-y-3">
        {aiDecisions.slice(0, 5).map((dec, i) => (
          <div key={i} className="bg-gray-900 p-4 rounded-xl text-sm">
            <span className="text-gray-400">{new Date(dec.timestamp).toLocaleTimeString()}</span> - {dec.action}
          </div>
        ))}
      </div>
    </div>
  );
}