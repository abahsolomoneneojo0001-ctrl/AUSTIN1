import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, X, ChevronRight, Video, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, addDays } from 'date-fns';

const AUSTIN = {
  name: 'Austin',
  title: 'Head Coach & Founder',
  initials: 'A',
  price: 120,
  color: 'from-ff-primary to-ff-primary/80',
  textColor: 'text-black',
  rating: 5.0,
  reviews: 428,
  tags: [
    { label: 'Strength', c: 'text-ff-primary bg-ff-primary/10' },
    { label: 'Hypertrophy', c: 'text-ff-tertiary bg-ff-tertiary/10' },
    { label: 'Nutrition', c: 'text-ff-quaternary bg-ff-quaternary/10' }
  ],
  clients: 150,
  exp: '10yr+',
  avail: 'Limited availability',
  availColor: 'bg-ff-quaternary',
};

export default function CoachAustinView() {
  const [activeTab, setActiveTab] = useState('profile');
  const [bookingStep, setBookingStep] = useState(0); // 0 = not booking
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState('online');
  const [slots, setSlots] = useState<{time: string, available: boolean}[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (selectedDate !== null) {
      setLoadingSlots(true);
      const targetDate = format(addDays(new Date(), selectedDate), 'yyyy-MM-dd');
      fetch(`/api/coach/availability?date=${targetDate}`)
        .then(res => res.json())
        .then(data => {
          setSlots(data.slots);
          setLoadingSlots(false);
          setSelectedSlot(null);
        })
        .catch(err => {
          console.error(err);
          setLoadingSlots(false);
        });
    }
  }, [selectedDate]);

  const openBooking = () => {
    setBookingStep(1);
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const closeBooking = () => {
    setBookingStep(0);
  };

  const handleNextStep = () => {
    if (bookingStep === 1 && selectedDate !== null && selectedSlot) setBookingStep(2);
    else if (bookingStep === 2) setBookingStep(3);
    else if (bookingStep === 3) {
      closeBooking();
      alert('Booking Confirmed! I will see you then. - Austin');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
        {['profile', 'bookings', 'videos'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all", activeTab === tab ? "bg-ff-surface text-ff-text" : "text-ff-muted hover:text-ff-text")}
          >
            {tab === 'profile' ? '1-on-1 Coaching' : tab === 'bookings' ? 'My Bookings' : 'Video Library'}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Austin's Profile Card */}
          <div className="bg-ff-surface rounded-[32px] border border-ff-surface overflow-hidden">
            <div className="h-48 relative overflow-hidden bg-gradient-to-br from-ff-surface to-black">
              <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/gym/1200/400')] bg-cover bg-center mix-blend-overlay" />
              <div className="absolute -bottom-10 left-8">
                <div className={cn("w-28 h-28 rounded-full border-4 border-ff-surface flex items-center justify-center text-5xl font-black bg-gradient-to-br", AUSTIN.color, AUSTIN.textColor)}>
                  {AUSTIN.initials}
                </div>
              </div>
            </div>
            
            <div className="p-8 pt-14">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <h1 className="font-display text-4xl tracking-wide mb-1">{AUSTIN.name}</h1>
                  <p className="text-ff-primary font-bold tracking-wide uppercase text-sm mb-4">{AUSTIN.title}</p>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[#FF9F43] text-lg tracking-widest">★★★★★</span>
                    <span className="font-bold">{AUSTIN.rating}</span>
                    <span className="text-ff-muted">({AUSTIN.reviews} reviews)</span>
                  </div>

                  <p className="text-ff-muted max-w-2xl leading-relaxed mb-6">
                    Hey, I'm Austin. I built this app to give you the exact tools I use with my private clients. 
                    If you need personalized guidance, form correction, or a complete overhaul of your routine, 
                    book a 1-on-1 session with me. Let's forge your best self.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {AUSTIN.tags.map(tag => (
                      <span key={tag.label} className={cn("px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide", tag.c)}>{tag.label}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-ff-surface p-6 rounded-2xl border border-ff-surface min-w-[280px]">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-ff-muted font-bold uppercase text-xs tracking-wider">Session Rate</span>
                    <span className="font-mono text-3xl font-bold text-ff-primary">${AUSTIN.price}</span>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <Video className="w-5 h-5 text-ff-tertiary" />
                      <span>60-min Video Call</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MessageSquare className="w-5 h-5 text-ff-quaternary" />
                      <span>Direct Chat Access</span>
                    </div>
                  </div>
                  <button 
                    onClick={openBooking}
                    className="w-full py-4 bg-ff-primary text-black font-bold rounded-xl hover:bg-ff-primary/80 transition-colors"
                  >
                    Book a Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="bg-ff-surface rounded-[20px] p-6 flex gap-6 items-start border border-ff-quaternary/30">
            <div className="w-2 h-full min-h-[100px] rounded-full bg-ff-quaternary shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-display text-2xl tracking-wide">Form Check & Strategy</h4>
                  <p className="text-ff-muted">with <span className="text-ff-text font-bold">Austin</span></p>
                </div>
                <span className="px-3 py-1 bg-ff-quaternary/10 text-ff-quaternary text-xs font-bold rounded-full uppercase tracking-wider">Confirmed</span>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-ff-muted mt-4 bg-ff-bg p-4 rounded-xl">
                <span className="flex items-center gap-2 font-mono"><Calendar className="w-4 h-4 text-ff-primary"/> Tomorrow, Mar 12</span>
                <span className="flex items-center gap-2 font-mono"><Clock className="w-4 h-4 text-ff-primary"/> 8:00 AM - 9:00 AM</span>
                <span className="flex items-center gap-2 font-mono"><MapPin className="w-4 h-4 text-ff-primary"/> Online (Zoom)</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <button className="px-6 py-3 bg-ff-primary text-black text-sm font-bold rounded-xl hover:bg-ff-primary/80">Join Call</button>
              <button className="px-6 py-3 bg-ff-bg text-ff-text text-sm font-bold rounded-xl hover:bg-ff-bg/80">Reschedule</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { title: 'Perfecting the Deadlift Form', duration: '12:45', thumb: 'https://picsum.photos/seed/deadlift/600/400' },
            { title: 'Nutrition 101: Macros Explained', duration: '18:20', thumb: 'https://picsum.photos/seed/nutrition/600/400' },
            { title: 'Mobility Routine for Squats', duration: '08:15', thumb: 'https://picsum.photos/seed/mobility/600/400' },
            { title: 'How to Break a Plateau', duration: '15:30', thumb: 'https://picsum.photos/seed/plateau/600/400' },
          ].map((vid, i) => (
            <div key={i} className="bg-ff-surface rounded-[20px] overflow-hidden group cursor-pointer border border-ff-surface hover:border-ff-primary/30 transition-all">
              <div className="relative h-48 overflow-hidden">
                <img src={vid.thumb} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-xs font-mono font-bold backdrop-blur-sm">
                  {vid.duration}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-ff-primary rounded-full flex items-center justify-center text-black pl-1">
                    ▶
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg leading-tight group-hover:text-ff-primary transition-colors">{vid.title}</h3>
                <p className="text-sm text-ff-muted mt-2">Austin's Masterclass</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING SLIDE-OVER PANEL */}
      {bookingStep > 0 && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={closeBooking} />
          <div className={cn(
            "fixed inset-y-0 right-0 w-full md:w-[420px] bg-ff-surface border-l border-ff-surface z-50 flex flex-col transform transition-transform duration-300",
            bookingStep > 0 ? "translate-x-0" : "translate-x-full"
          )}>
            <div className="p-6 border-b border-ff-surface flex justify-between items-center">
              <div>
                <h2 className="font-display text-2xl tracking-wide text-ff-text">Book a Session</h2>
                <p className="text-sm text-ff-muted">with Austin</p>
              </div>
              <button onClick={closeBooking} className="p-2 bg-ff-bg rounded-xl hover:bg-ff-surface/80"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex gap-2 mb-8">
                {[1,2,3].map(step => (
                  <div key={step} className={cn("h-1.5 flex-1 rounded-full transition-colors", bookingStep >= step ? "bg-ff-primary" : "bg-ff-bg")} />
                ))}
              </div>

              {bookingStep === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="font-bold text-lg">1. Choose Date & Time</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {['Today\nMar 11', 'Tue\nMar 12', 'Wed\nMar 13'].map((d, i) => {
                      const [day, date] = d.split('\n');
                      const isSelected = selectedDate === i;
                      return (
                        <button key={i} onClick={() => setSelectedDate(i)} className={cn(
                          "flex-shrink-0 w-16 py-3 rounded-2xl border flex flex-col items-center gap-1 transition-all",
                          isSelected ? "bg-ff-primary border-ff-primary text-black" : "bg-ff-bg border-ff-bg text-ff-text hover:border-ff-primary/50"
                        )}>
                          <span className={cn("text-xs font-bold", isSelected ? "text-black/70" : "text-ff-muted")}>{day}</span>
                          <span className="font-display text-2xl">{date.split(' ')[1]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-ff-muted">Available Slots</h4>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-ff-primary" />
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {slots.map((slot) => (
                          <button 
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border transition-all",
                              !slot.available ? "opacity-50 cursor-not-allowed bg-ff-bg border-ff-bg" :
                              selectedSlot === slot.time ? "bg-ff-primary/10 border-ff-primary" : "bg-ff-bg border-ff-bg hover:border-ff-primary/50"
                            )}
                          >
                            <span className="font-mono font-bold">{slot.time}</span>
                            <span className={cn("font-mono font-bold", !slot.available ? "text-ff-muted" : "text-ff-primary")}>
                              {!slot.available ? 'Booked' : `$${AUSTIN.price}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="font-bold text-lg">2. Session Details</h3>
                  <div className="bg-ff-bg p-4 rounded-xl">
                    <p className="text-sm text-ff-muted mb-1">Selected Time</p>
                    <p className="font-mono font-bold text-ff-primary text-lg">{selectedSlot} · 60 min</p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-ff-muted">Session Type</label>
                    <div className="flex gap-3">
                      <button onClick={() => setSessionType('online')} className={cn("flex-1 py-3 rounded-xl border font-bold text-sm transition-all", sessionType === 'online' ? "bg-ff-primary/10 border-ff-primary text-ff-primary" : "bg-ff-bg border-ff-bg text-ff-text")}>🖥️ Online (Zoom)</button>
                      <button onClick={() => setSessionType('in-person')} className={cn("flex-1 py-3 rounded-xl border font-bold text-sm transition-all", sessionType === 'in-person' ? "bg-ff-primary/10 border-ff-primary text-ff-primary" : "bg-ff-bg border-ff-bg text-ff-text")}>🏋️ In-Person</button>
                    </div>
                  </div>

                  <textarea 
                    className="w-full bg-ff-bg border border-ff-bg rounded-xl p-4 text-sm text-ff-text outline-none focus:border-ff-primary transition-colors resize-none h-32"
                    placeholder="Any injuries, goals, or specific requests for Austin..."
                  />
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="font-bold text-lg">3. Review & Confirm</h3>
                  <div className="bg-ff-bg rounded-[20px] p-6 space-y-4">
                    <div className="flex justify-between"><span className="text-ff-muted">Time</span><span className="font-bold">{selectedSlot}</span></div>
                    <div className="flex justify-between"><span className="text-ff-muted">Type</span><span className="font-bold">{sessionType === 'online' ? 'Online' : 'In-Person'}</span></div>
                    <div className="pt-4 border-t border-ff-surface flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-mono font-bold text-2xl text-ff-primary">${AUSTIN.price}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-ff-surface bg-ff-surface">
              <button 
                onClick={handleNextStep}
                disabled={bookingStep === 1 && (selectedDate === null || !selectedSlot)}
                className="w-full py-4 bg-ff-primary text-black font-bold rounded-xl hover:bg-ff-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
