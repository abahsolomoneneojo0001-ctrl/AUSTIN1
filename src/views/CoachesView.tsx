import React, { useState } from 'react';
import { Search, Clock, Calendar, MapPin, X, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const COACHES = [
  { 
    id: 1, name: 'Amara Kone', title: 'Elite Strength & Conditioning Coach', initials: 'AK', price: 75, 
    color: 'from-[#E8FF47] to-[#aabb00]', textColor: 'text-black', rating: 4.9, reviews: 218, 
    tags: [{label:'Strength', c:'text-ff-primary bg-ff-primary/10'}, {label:'Powerlifting', c:'text-ff-tertiary bg-ff-tertiary/10'}], 
    clients: 340, exp: '5yr', avail: 'Available today', availColor: 'bg-ff-quaternary',
    slots: ['7:00 AM', '11:00 AM', '2:00 PM']
  },
  { 
    id: 2, name: 'Marcus Osei', title: 'HIIT & Cardio Specialist', initials: 'MO', price: 60, 
    color: 'from-[#00D4FF] to-[#0088aa]', textColor: 'text-black', rating: 4.8, reviews: 156, 
    tags: [{label:'HIIT', c:'text-ff-secondary bg-ff-secondary/10'}, {label:'Cardio', c:'text-ff-tertiary bg-ff-tertiary/10'}], 
    clients: 210, exp: '3yr', avail: '3 slots left', availColor: 'bg-[#FF9F43]',
    slots: ['6:00 AM', '12:00 PM']
  }
];

export default function CoachesView() {
  const [activeTab, setActiveTab] = useState('find');
  const [search, setSearch] = useState('');
  const [bookingCoach, setBookingCoach] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const openBooking = (coach: any) => {
    if (coach.slots.length === 0) return;
    setBookingCoach(coach);
    setBookingStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const closeBooking = () => {
    setBookingCoach(null);
    setTimeout(() => setBookingStep(1), 300);
  };

  const handleNextStep = () => {
    if (bookingStep === 1 && selectedDate !== null && selectedSlot) setBookingStep(2);
    else if (bookingStep === 2) setBookingStep(3);
    else if (bookingStep === 3) {
      closeBooking();
      alert('Booking Confirmed! The coach has been notified.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {['find', 'bookings'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={cn("px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all", activeTab === tab ? "bg-ff-surface text-ff-text" : "text-ff-muted hover:text-ff-text")}
            >
              {tab === 'find' ? 'Find Coaches' : 'My Bookings'}
            </button>
          ))}
        </div>
        
        {activeTab === 'find' && (
          <div className="flex items-center gap-2 bg-ff-surface border border-ff-surface rounded-xl px-4 py-2 w-full md:w-64">
            <Search className="w-4 h-4 text-ff-muted" />
            <input 
              type="text" 
              placeholder="Search coaches..." 
              className="bg-transparent border-none outline-none text-sm text-ff-text w-full placeholder:text-ff-muted"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {activeTab === 'find' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COACHES.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(coach => (
            <div key={coach.id} onClick={() => openBooking(coach)} className="bg-ff-surface rounded-[20px] border border-ff-surface overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:border-ff-primary/30 transition-all cursor-pointer group">
              <div className={cn("h-[100px] relative overflow-hidden bg-gradient-to-br", coach.color)}>
                <div className="absolute -bottom-6 left-5">
                  <div className={cn("w-16 h-16 rounded-full border-[3px] border-ff-surface flex items-center justify-center text-2xl font-black bg-gradient-to-br", coach.color, coach.textColor)}>
                    {coach.initials}
                  </div>
                </div>
              </div>
              <div className="p-5 pt-8">
                <h3 className="font-bold text-lg mb-0.5">{coach.name}</h3>
                <p className="text-xs text-ff-muted mb-3">{coach.title}</p>
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-[#FF9F43] text-sm tracking-widest">★★★★★</span>
                  <span className="text-xs font-bold ml-1">{coach.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {coach.tags.map(tag => (
                    <span key={tag.label} className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide", tag.c)}>{tag.label}</span>
                  ))}
                </div>
                <div className="flex gap-4 mb-4 pt-4 border-t border-ff-bg">
                  <div className="text-center flex-1"><div className="font-display text-xl text-ff-text">{coach.clients}</div><div className="text-[10px] text-ff-muted uppercase tracking-wider">Clients</div></div>
                  <div className="text-center flex-1"><div className="font-display text-xl text-ff-text">${coach.price}</div><div className="text-[10px] text-ff-muted uppercase tracking-wider">/ Hour</div></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <div className={cn("w-2 h-2 rounded-full", coach.availColor, coach.slots.length > 0 && "animate-pulse")} />
                    {coach.avail}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openBooking(coach); }} 
                    className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-colors", coach.slots.length > 0 ? "bg-ff-primary text-black hover:bg-[#d4eb33]" : "bg-ff-bg text-ff-muted")}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="bg-ff-surface rounded-[20px] p-5 flex gap-4 items-start border border-ff-quaternary/30">
            <div className="w-1.5 h-full min-h-[80px] rounded-full bg-ff-quaternary shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-lg">Upper Body Strength Session</h4>
                  <p className="text-sm text-ff-muted">with <span className="text-ff-text font-medium">Amara Kone</span></p>
                </div>
                <span className="px-3 py-1 bg-ff-quaternary/10 text-ff-quaternary text-xs font-bold rounded-full">✓ Confirmed</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-ff-muted mt-4">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Tomorrow, Mar 12</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> 8:00 AM - 9:00 AM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {bookingCoach && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeBooking} />
          <div className={cn(
            "fixed inset-y-0 right-0 w-full md:w-[420px] bg-[#111116] border-l border-ff-surface z-50 flex flex-col transform transition-transform duration-300",
            bookingCoach ? "translate-x-0" : "translate-x-full"
          )}>
            <div className="p-6 border-b border-ff-surface flex justify-between items-center">
              <div>
                <h2 className="font-display text-2xl tracking-wide text-ff-text">Book a Session</h2>
                <p className="text-sm text-ff-muted">with {bookingCoach.name}</p>
              </div>
              <button onClick={closeBooking} className="p-2 bg-ff-surface rounded-xl hover:bg-ff-surface/80"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex gap-2 mb-8">
                {[1,2,3].map(step => (
                  <div key={step} className={cn("h-1.5 flex-1 rounded-full transition-colors", bookingStep >= step ? "bg-ff-primary" : "bg-ff-surface")} />
                ))}
              </div>

              {bookingStep === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="font-bold text-lg">1. Choose Date & Time</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {['Today\nMar 11', 'Tue\nMar 12'].map((d, i) => {
                      const [day, date] = d.split('\n');
                      const isSelected = selectedDate === i;
                      return (
                        <button key={i} onClick={() => setSelectedDate(i)} className={cn(
                          "flex-shrink-0 w-16 py-3 rounded-2xl border flex flex-col items-center gap-1 transition-all",
                          isSelected ? "bg-ff-primary border-ff-primary text-black" : "bg-ff-surface border-ff-surface text-ff-text hover:border-ff-primary/50"
                        )}>
                          <span className={cn("text-xs font-bold", isSelected ? "text-black/70" : "text-ff-muted")}>{day}</span>
                          <span className="font-display text-2xl">{date.split(' ')[1]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-ff-muted">Available Slots</h4>
                    <div className="grid gap-3">
                      {bookingCoach.slots.map((slot: string) => (
                        <button 
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all",
                            selectedSlot === slot ? "bg-ff-primary/10 border-ff-primary" : "bg-ff-surface border-ff-surface hover:border-ff-primary/50"
                          )}
                        >
                          <span className="font-mono font-bold">{slot}</span>
                          <span className="font-mono font-bold text-ff-primary">${bookingCoach.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="font-bold text-lg">2. Session Details</h3>
                  <div className="bg-ff-surface p-4 rounded-xl">
                    <p className="text-sm text-ff-muted mb-1">Selected Time</p>
                    <p className="font-mono font-bold text-ff-primary text-lg">{selectedSlot} · 60 min</p>
                  </div>
                  <textarea 
                    className="w-full bg-ff-surface border border-ff-surface rounded-xl p-4 text-sm text-ff-text outline-none focus:border-ff-primary transition-colors resize-none h-32"
                    placeholder="Any injuries, goals, or specific requests..."
                  />
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="font-bold text-lg">3. Review & Confirm</h3>
                  <div className="bg-ff-surface rounded-[20px] p-6 space-y-4">
                    <div className="flex justify-between"><span className="text-ff-muted">Time</span><span className="font-bold">{selectedSlot}</span></div>
                    <div className="pt-4 border-t border-ff-bg flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-mono font-bold text-2xl text-ff-primary">${bookingCoach.price}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-ff-surface bg-[#111116]">
              <button 
                onClick={handleNextStep}
                disabled={bookingStep === 1 && (selectedDate === null || !selectedSlot)}
                className="w-full py-4 bg-ff-primary text-black font-bold rounded-xl hover:bg-[#d4eb33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bookingStep === 3 ? '🎉 Confirm Booking' : 'Continue'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
