import React from 'react';
import { useParams } from 'react-router-dom';
import { useBusinessStore } from '../lib/store';

export default function BusinessDetail() {
  const { id } = useParams();
  const { businesses, currentBusiness } = useBusinessStore();
  const business = businesses.find(b => b.id === parseInt(id)) || currentBusiness;

  if (!business) return <div className="p-8">Business not found</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{business.name}</h1>
      <div className="bg-gray-900 p-8 rounded-2xl">
        <div className="text-emerald-400 text-xl mb-4">Status: {business.status}</div>
        <div>Progress: {business.progress}%</div>
        <div className="mt-8">
          <h3 className="font-medium mb-3">Idea</h3>
          <p className="text-gray-400">{business.idea}</p>
        </div>
      </div>
    </div>
  );
}