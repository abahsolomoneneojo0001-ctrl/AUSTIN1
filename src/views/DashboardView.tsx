import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function DashboardView({ onNavigate, userName = "Alex", userId }: { onNavigate: (tab: any) => void, userName?: string, userId?: string }) {
  const currentDate = new Date();
  const dateString = format(currentDate, "EEEE — 'Leg day'");

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Good morning, <span className="text-ff-lime">{userName}</span></h1>
          <p className="text-ff-muted text-sm">{dateString}</p>
        </div>
        <div className="w-12 h-12 rounded-full border border-ff-lime flex items-center justify-center text-ff-lime font-bold text-sm tracking-wider">
           {userName.substring(0, 2).toUpperCase()}
        </div>
      </div>

      {/* Hero Card: Calories */}
      <div className="relative overflow-hidden rounded-[20px] bg-ff-lime p-6">
        {/* Subtle decorative circle */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-black/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10">
          <p className="text-black/80 font-medium mb-1 tracking-tight">Today's calories burned</p>
          <div className="flex items-baseline gap-1 mb-4">
            <h2 className="text-5xl font-medium tracking-tight text-black">1,842</h2>
            <span className="text-black/70 font-medium">kcal</span>
          </div>
          
          <div className="flex items-center justify-between text-black/70 text-sm mb-3 font-medium">
            <span>Goal: 2,200 kcal</span>
            <span>67% complete</span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
            <div className="h-full bg-black rounded-full" style={{ width: '67%' }} />
          </div>
        </div>
      </div>

      {/* Stats Grid: Row 1 */}
      <div className="grid grid-cols-3 gap-3">
        {/* Steps */}
        <div className="p-4 rounded-[20px] bg-ff-surface border border-transparent shadow-sm">
          <h3 className="text-2xl font-medium text-white mb-1">8,341</h3>
          <p className="text-sm text-ff-muted mb-3">Steps</p>
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-ff-lime/10 text-ff-lime text-xs font-medium">
            +12%
          </div>
        </div>

        {/* Active */}
        <div className="p-4 rounded-[20px] bg-ff-surface border border-transparent shadow-sm">
          <h3 className="text-2xl font-medium text-white mb-1">42<span className="text-base text-ff-muted font-normal ml-0.5">min</span></h3>
          <p className="text-sm text-ff-muted mb-3">Active</p>
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-ff-amber/10 text-ff-amber text-xs font-medium">
            On track
          </div>
        </div>

        {/* Heart rate */}
        <div className="p-4 rounded-[20px] bg-ff-surface border border-transparent shadow-sm">
          <h3 className="text-2xl font-medium text-white mb-1">78<span className="text-base text-ff-muted font-normal ml-0.5">bpm</span></h3>
          <p className="text-sm text-ff-muted mb-3">Heart rate</p>
          <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-ff-coral/20 text-ff-coral/80 text-xs font-medium">
            Resting
          </div>
        </div>
      </div>

      {/* Stats Grid: Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Distance */}
        <div className="p-4 rounded-[20px] bg-ff-surface border border-[#1A1E29] shadow-sm">
          <div className="w-2 h-2 rounded-full bg-ff-lime mb-2 shadow-[0_0_8px_rgba(200,255,87,0.5)]" />
          <h3 className="text-xl font-medium text-white mb-1">5.2 <span className="text-sm text-ff-lime font-normal">km</span></h3>
          <p className="text-sm text-ff-muted">Distance</p>
        </div>

        {/* Water */}
        <div className="p-4 rounded-[20px] bg-[#121922] border border-[#1A2533] shadow-sm">
          <div className="w-2 h-2 rounded-full bg-ff-cyan mb-2 shadow-[0_0_8px_rgba(87,200,255,0.5)]" />
          <h3 className="text-xl font-medium text-ff-cyan mb-1">2.1 <span className="text-sm font-normal">L</span></h3>
          <p className="text-sm text-ff-muted">Water intake</p>
        </div>
      </div>

      {/* Stats Grid: Row 3 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Sleep */}
        <div className="p-4 rounded-[20px] bg-[#171221] border border-[#231A33] shadow-sm">
          <div className="w-2 h-2 rounded-full bg-ff-violet mb-2 shadow-[0_0_8px_rgba(155,87,255,0.5)]" />
          <h3 className="text-xl font-medium text-ff-violet mb-1">7h 20m</h3>
          <p className="text-sm text-ff-muted">Sleep</p>
        </div>

        {/* Peak HR */}
        <div className="p-4 rounded-[20px] bg-[#1D1313] border border-[#2D1A1A] shadow-sm">
          <div className="w-2 h-2 rounded-full bg-ff-coral mb-2 shadow-[0_0_8px_rgba(255,122,110,0.5)]" />
          <h3 className="text-xl font-medium text-ff-coral mb-1">148 <span className="text-sm font-normal">bpm</span></h3>
          <p className="text-sm text-ff-muted">Peak HR</p>
        </div>
      </div>

      {/* Weekly Steps Chart */}
      <div className="p-5 rounded-[20px] bg-ff-surface border border-ff-border mb-4">
        <p className="text-sm text-ff-muted mb-6">Weekly steps</p>
        <div className="flex items-end justify-between h-20 mb-3 gap-2">
          {/* M */}
          <div className="w-full flex flex-col items-center justify-end h-full">
            <div className="w-full bg-ff-border rounded-md" style={{ height: '20%' }} />
          </div>
          {/* T */}
          <div className="w-full flex flex-col items-center justify-end h-full">
            <div className="w-full bg-ff-border rounded-md" style={{ height: '40%' }} />
          </div>
          {/* W */}
          <div className="w-full flex flex-col items-center justify-end h-full">
            <div className="w-full bg-ff-border rounded-md" style={{ height: '30%' }} />
          </div>
          {/* T */}
          <div className="w-full flex flex-col items-center justify-end h-full">
            <div className="w-full bg-ff-border rounded-md" style={{ height: '50%' }} />
          </div>
          {/* F */}
          <div className="w-full flex flex-col items-center justify-end h-full">
            <div className="w-full bg-ff-border rounded-md" style={{ height: '35%' }} />
          </div>
          {/* S (Today, active) */}
          <div className="w-full flex flex-col items-center justify-end h-full">
            <div className="w-full bg-ff-lime rounded-md shadow-[0_0_15px_rgba(200,255,87,0.2)]" style={{ height: '80%' }} />
          </div>
          {/* S */}
          <div className="w-full flex flex-col items-center justify-end h-full">
            <div className="w-full bg-ff-border rounded-md" style={{ height: '15%' }} />
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-ff-muted font-medium px-2">
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span className="text-ff-lime font-bold">S</span>
          <span>S</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          className="py-4 rounded-[16px] bg-[#0A0A0F] border border-[#14141E] text-[#2A2A3E] font-medium text-sm transition-colors cursor-not-allowed"
          disabled
        >
          Start workout
        </button>
        <button 
          className="py-4 rounded-[16px] bg-[#0A0A0F] border border-[#14141E] text-[#2A2A3E] font-medium text-sm transition-colors cursor-not-allowed"
          disabled
        >
          Log meal
        </button>
      </div>

    </div>
  );
}
