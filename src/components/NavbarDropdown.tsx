import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { askFitnessCoach } from '../lib/gemini';
import './navbar.css';

interface NavbarDropdownProps {
  loading?: boolean;
  onLoginClick?: () => void;
}

interface ContentModal {
  isOpen: boolean;
  title: string;
  content: string;
  isLoading: boolean;
}

export default function NavbarDropdown({ loading = false, onLoginClick }: NavbarDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<ContentModal>({
    isOpen: false,
    title: '',
    content: '',
    isLoading: false,
  });

  const handleDropdownItemClick = async (title: string, subtitle: string) => {
    setModal({
      isOpen: true,
      title,
      content: '',
      isLoading: true,
    });

    try {
      const context = `Provide detailed, actionable fitness advice about "${subtitle}". Keep it concise (2-3 paragraphs), practical, and specific.`;
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
      );
      
      const response = await Promise.race([
        askFitnessCoach(context),
        timeoutPromise
      ]) as string;
      
      setModal(prev => ({
        ...prev,
        content: response,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Content generation error:', errorMessage);
      
      setModal(prev => ({
        ...prev,
        content: `⚠️ Unable to load content: ${errorMessage}\n\nMake sure your GEMINI_API_KEY environment variable is set correctly and you have an active internet connection.`,
        isLoading: false,
      }));
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Get all nav items and hamburger
    const navItems = container.querySelectorAll('.nav-item-wrapper');
    const hamburger = container.querySelector('.navbar-hamburger');
    const navMenu = container.querySelector('.navbar-nav');

    // Handle nav item hover/click for main menu toggle
    navItems.forEach(item => {
      const link = item.querySelector('.nav-item-link') as HTMLElement;
      
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          item.classList.toggle('active');
        });

        // Keyboard navigation: Enter/Space to toggle
        link.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.classList.toggle('active');
          }
          // Escape to close
          if (e.key === 'Escape') {
            item.classList.remove('active');
          }
        });
      }

      // Handle dropdown item clicks
      const dropdownItems = item.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>;
      dropdownItems.forEach(dropdownItem => {
        dropdownItem.addEventListener('click', (e) => {
          e.preventDefault();
          const title = dropdownItem.querySelector('.dropdown-item-title')?.textContent || 'Content';
          const subtitle = dropdownItem.querySelector('.dropdown-item-subtitle')?.textContent || '';
          handleDropdownItemClick(title, subtitle);
        });

        // Keyboard: Enter/Space to activate item
        dropdownItem.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const title = dropdownItem.querySelector('.dropdown-item-title')?.textContent || 'Content';
            const subtitle = dropdownItem.querySelector('.dropdown-item-subtitle')?.textContent || '';
            handleDropdownItemClick(title, subtitle);
          }
        });

        // Make items focusable
        dropdownItem.setAttribute('tabindex', '0');
        dropdownItem.setAttribute('role', 'button');
      });

      // Close dropdown when clicking outside
      item.addEventListener('mouseleave', () => {
        // Only close on desktop, not mobile
        if (window.innerWidth > 768) {
          item.classList.remove('active');
        }
      });

      item.addEventListener('mouseenter', () => {
        // Only open on desktop, not mobile
        if (window.innerWidth > 768) {
          item.classList.add('active');
        }
      });
    });

    // Handle hamburger menu
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('mobile-open');
      });

      // Close mobile menu when clicking nav item
      const mobileNavLinks = navMenu.querySelectorAll('.nav-item-link');
      mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
          // Don't close menu on dropdown toggle, just toggle the item
          if ((link as HTMLElement).closest('.nav-item-wrapper')) {
            const wrapper = (link as HTMLElement).closest('.nav-item-wrapper');
            wrapper?.classList.toggle('active');
          }
        });
      });
    }

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth > 768) {
        // Reset mobile menu on resize to desktop
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('mobile-open');
      }
    };

    window.addEventListener('resize', handleResize);

    // Keyboard navigation: Escape to close all menus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navItems.forEach(item => item.classList.remove('active'));
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('mobile-open');
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <nav className="navbar" ref={containerRef}>
      <div className="navbar-container">
        {/* Logo */}
        <a href="/" className="navbar-logo">
          <img src="/logo.jpeg" alt="AUSTIN FITNESS - Return to Homepage" />
        </a>

        {/* Hamburger Menu */}
        <button className="navbar-hamburger" aria-label="Toggle navigation menu" aria-expanded="false">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Navigation Menu */}
        <ul className="navbar-nav">
          {/* About */}
          <li className="nav-item-wrapper">
            <button className="nav-item-link" data-dropdown="about">
              <span>About</span>
              <svg className="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <div className="dropdown-section-label">About</div>
                <button className="dropdown-item" aria-label="Learn our fitness story">
                  <span className="dropdown-item-icon">📖</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Our Story</p>
                    <p className="dropdown-item-subtitle">Learn our journey</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Meet expert coaches and trainers">
                  <span className="dropdown-item-icon">👥</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Meet the Team</p>
                    <p className="dropdown-item-subtitle">Expert coaches & trainers</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Learn about our fitness mission">
                  <span className="dropdown-item-icon">🎯</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Our Mission</p>
                    <p className="dropdown-item-subtitle">What drives us forward</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Read latest fitness announcements">
                  <span className="dropdown-item-icon">📰</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">News & Updates</p>
                    <p className="dropdown-item-subtitle">Latest announcements</p>
                  </div>
                </button>
              </div>
            </div>
          </li>

          {/* Trainings */}
          <li className="nav-item-wrapper">
            <button className="nav-item-link" data-dropdown="trainings">
              <span>Trainings</span>
              <svg className="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <div className="dropdown-section-label">Programs</div>
                <button className="dropdown-item" aria-label="Learn about strength and conditioning programs">
                  <span className="dropdown-item-icon">💪</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Strength & Conditioning</p>
                    <p className="dropdown-item-subtitle">Build power and muscle</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Explore speed training programs">
                  <span className="dropdown-item-icon">⚡</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Speed Training</p>
                    <p className="dropdown-item-subtitle">Boost your performance</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Learn about recovery and mobility training">
                  <span className="dropdown-item-icon">🧘</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Recovery & Mobility</p>
                    <p className="dropdown-item-subtitle">Improve flexibility & recovery</p>
                  </div>
                </button>
              </div>
              <div className="dropdown-section">
                <div className="dropdown-section-label">Format</div>
                <button className="dropdown-item" aria-label="Book personalized one-on-one training sessions">
                  <span className="dropdown-item-icon">👨‍🏫</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">1-on-1 Sessions</p>
                    <p className="dropdown-item-subtitle">Personalized training</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Join group fitness classes">
                  <span className="dropdown-item-icon">👫</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Group Classes</p>
                    <p className="dropdown-item-subtitle">Train with others</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Join online training programs">
                  <span className="dropdown-item-icon">💻</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Online Programs</p>
                    <p className="dropdown-item-subtitle">Train from anywhere</p>
                  </div>
                </button>
              </div>
            </div>
          </li>

          {/* Testimonials */}
          <li className="nav-item-wrapper">
            <button className="nav-item-link" data-dropdown="testimonials">
              <span>Testimonials</span>
              <svg className="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <div className="dropdown-section-label">Testimonials</div>
                <button className="dropdown-item" aria-label="Read client success stories and reviews">
                  <span className="dropdown-item-icon">⭐</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Client Reviews</p>
                    <p className="dropdown-item-subtitle">Read success stories</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="View before and after transformation results">
                  <span className="dropdown-item-icon">🔄</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Transformations</p>
                    <p className="dropdown-item-subtitle">Before & after results</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Watch client video testimonials">
                  <span className="dropdown-item-icon">🎥</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Video Stories</p>
                    <p className="dropdown-item-subtitle">Watch client videos</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Share your fitness experience with us">
                  <span className="dropdown-item-icon">💬</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Leave a Review</p>
                    <p className="dropdown-item-subtitle">Share your experience</p>
                  </div>
                </button>
              </div>
            </div>
          </li>

          {/* Contacts */}
          <li className="nav-item-wrapper">
            <button className="nav-item-link" data-dropdown="contacts">
              <span>Contacts</span>
              <svg className="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <div className="dropdown-section-label">Get in Touch</div>
                <button className="dropdown-item" aria-label="Find our gym location">
                  <span className="dropdown-item-icon">📍</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Find Us</p>
                    <p className="dropdown-item-subtitle">Visit our location</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Call us for more information">
                  <span className="dropdown-item-icon">☎️</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Call Us</p>
                    <p className="dropdown-item-subtitle">Speak with our team</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Send us an email">
                  <span className="dropdown-item-icon">✉️</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Email Us</p>
                    <p className="dropdown-item-subtitle">Send us a message</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Schedule a training session">
                  <span className="dropdown-item-icon">📅</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Book a Session</p>
                    <p className="dropdown-item-subtitle">Schedule your training</p>
                  </div>
                </button>
              </div>
            </div>
          </li>
        </ul>

        {/* Login Button */}
        <button
          onClick={onLoginClick}
          disabled={loading}
          className="navbar-login-btn"
          aria-busy={loading}
        >
          {loading && <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />}
          LOGIN
        </button>
      </div>

      {/* AI Content Modal */}
      {modal.isOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => !modal.isLoading && setModal(prev => ({ ...prev, isOpen: false }))}
          role="presentation"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title">{modal.title}</h2>
              <button
                onClick={() => !modal.isLoading && setModal(prev => ({ ...prev, isOpen: false }))}
                className="modal-close-btn"
                aria-label="Close modal"
                disabled={modal.isLoading}
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {modal.isLoading ? (
                <div className="modal-loading">
                  <Loader2 className="spinner" />
                  <p>Loading AI insights...</p>
                </div>
              ) : (
                <div className="modal-text">
                  {modal.content.split('\n').map((paragraph, idx) => (
                    paragraph.trim() && <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                className="modal-action-btn"
                disabled={modal.isLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
