import React from 'react';
import { Users, Search } from 'lucide-react';

export function DatabaseScreen({
  searchQuery,
  setSearchQuery,
  searchResult,
  handleSearch,
  handleGenerateIDCard,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow border">
        <h2 className="font-bold">Student Database Search</h2>
        <div className="mt-3 flex gap-3">
          <input type="text" placeholder="Enter Roll No or Name" className="flex-1 p-3 border rounded" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toUpperCase())} />
          <button onClick={() => { handleSearch(); setSearchQuery(''); }} className="bg-red-700 text-white px-4 py-3 rounded">Search</button>
        </div>
        {searchResult === 'not-found' && <p className="mt-3 text-red-600">No student found for given query.</p>}
        {searchResult && searchResult !== 'not-found' && (
          <div className="mt-4 bg-white rounded-xl overflow-hidden border shadow">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-1 bg-slate-100 p-3 flex items-center justify-center">
                {searchResult.photo ? <img src={searchResult.photo} className="w-full h-48 object-cover" alt="" /> : 'No Photo'}
              </div>
              <div className="p-4 md:col-span-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl">{searchResult.name}</h3>
                    <div className="text-sm">{searchResult.branch} · {searchResult.year}</div>
                  </div>
                  <button onClick={() => handleGenerateIDCard(searchResult)} className="bg-blue-600 text-white px-3 py-2 rounded">Download ID</button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div><div className="text-xs text-slate-400">Roll No</div><div>{searchResult.studentId}</div></div>
                  <div><div className="text-xs text-slate-400">Phone</div><div>{searchResult.phone}</div></div>
                  <div><div className="text-xs text-slate-400">Email</div><div className="break-all">{searchResult.email}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
