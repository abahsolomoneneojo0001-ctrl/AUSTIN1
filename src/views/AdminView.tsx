import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, LogOut, TrendingUp, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminView({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-ff-bg text-ff-text font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-ff-surface border-r border-ff-surface p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-ff-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <span className="text-2xl font-display tracking-wider text-ff-text">FWA ADMIN</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                tab.id === 'dashboard' ? "bg-ff-primary text-black" : "text-ff-muted hover:text-ff-text hover:bg-ff-surface"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={onLogout}
          className="mt-auto w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-display tracking-wide text-ff-text mb-2">Admin Dashboard</h1>
            <p className="text-ff-muted">Manage your users, bookings, and app metrics.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ff-muted" />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full bg-ff-surface border border-ff-surface rounded-xl py-2.5 pl-10 pr-4 text-ff-text placeholder:text-ff-muted focus:outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary transition-all"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Users', value: '1,248', change: '+12% this month' },
            { label: 'Active Subscriptions', value: '892', change: '+5% this month' },
            { label: 'Upcoming Sessions', value: '45', change: 'Next 7 days' },
          ].map((stat, i) => (
            <div key={i} className="bg-ff-surface p-6 rounded-2xl border border-ff-surface">
              <p className="text-sm text-ff-muted font-bold uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="text-4xl font-mono font-bold text-ff-text mb-2">{stat.value}</p>
              <p className="text-sm text-ff-primary font-bold">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-ff-surface rounded-2xl border border-ff-surface overflow-hidden">
          <div className="p-6 border-b border-ff-surface">
            <h2 className="text-xl font-display tracking-wide text-ff-text">Recent Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-ff-surface/50 text-xs uppercase tracking-wider text-ff-muted font-bold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Streak</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ff-surface">
                {[
                  { name: 'Jacob S.', email: 'jacob@example.com', status: 'Active', streak: 14, date: 'Mar 10, 2026' },
                  { name: 'Sarah M.', email: 'sarah@example.com', status: 'Premium', streak: 42, date: 'Feb 15, 2026' },
                  { name: 'Mike T.', email: 'mike@example.com', status: 'Inactive', streak: 0, date: 'Jan 02, 2026' },
                ].map((user, i) => (
                  <tr key={i} className="hover:bg-ff-surface/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ff-primary to-ff-quaternary flex items-center justify-center text-black font-bold text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-ff-text">{user.name}</p>
                          <p className="text-xs text-ff-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        user.status === 'Premium' ? "bg-ff-primary/10 text-ff-primary" :
                        user.status === 'Active' ? "bg-ff-tertiary/10 text-ff-tertiary" : "bg-ff-surface text-ff-muted"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-ff-text">{user.streak} days</td>
                    <td className="px-6 py-4 text-sm text-ff-muted">{user.date}</td>
                    <td className="px-6 py-4">
                      <button className="text-sm font-bold text-ff-primary hover:text-ff-text transition-colors">View Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
