import React, { useState } from 'react';
import { useBusinessStore } from '../lib/store';

export default function CreateBusiness() {
  const [idea, setIdea] = useState('');
  const { createBusiness, isLoading } = useBusinessStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (idea.trim()) {
      createBusiness(idea);
      setIdea('');
      alert('Business creation started! Check dashboard for progress.');
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Launch New Business</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Describe your business idea</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl p-4 text-white"
            placeholder="A platform that connects local farmers with urban consumers using AI recommendations..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-white text-black px-8 py-3 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading ? 'Launching Agent...' : 'Launch Autonomous Founder Agent'}
        </button>
      </form>
    </div>
  );
}