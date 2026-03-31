import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import './navbar.css';

interface NavbarDropdownProps {
  loading?: boolean;
  onLoginClick?: () => void;
}

export default function NavbarDropdown({ loading = false, onLoginClick }: NavbarDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Get all nav items and hamburger
    const navItems = container.querySelectorAll('.nav-item-wrapper');
    const hamburger = container.querySelector('.navbar-hamburger');
    const navMenu = container.querySelector('.navbar-nav');

    // Handle nav item hover/click
    navItems.forEach(item => {
      const link = item.querySelector('.nav-item-link') as HTMLElement;
      
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          item.classList.toggle('active');
        });
      }

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

    return () => {
      window.removeEventListener('resize', handleResize);
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
                <a href="#our-story" className="dropdown-item">
                  <span className="dropdown-item-icon">📖</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Our Story</p>
                    <p className="dropdown-item-subtitle">Learn our journey</p>
                  </div>
                </a>
                <a href="#meet-team" className="dropdown-item">
                  <span className="dropdown-item-icon">👥</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Meet the Team</p>
                    <p className="dropdown-item-subtitle">Expert coaches & trainers</p>
                  </div>
                </a>
                <a href="#our-mission" className="dropdown-item">
                  <span className="dropdown-item-icon">🎯</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Our Mission</p>
                    <p className="dropdown-item-subtitle">What drives us forward</p>
                  </div>
                </a>
                <a href="#news-updates" className="dropdown-item">
                  <span className="dropdown-item-icon">📰</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">News & Updates</p>
                    <p className="dropdown-item-subtitle">Latest announcements</p>
                  </div>
                </a>
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
                <a href="#strength-conditioning" className="dropdown-item">
                  <span className="dropdown-item-icon">💪</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Strength & Conditioning</p>
                    <p className="dropdown-item-subtitle">Build power and muscle</p>
                  </div>
                </a>
                <a href="#speed-training" className="dropdown-item">
                  <span className="dropdown-item-icon">⚡</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Speed Training</p>
                    <p className="dropdown-item-subtitle">Boost your performance</p>
                  </div>
                </a>
                <a href="#recovery-mobility" className="dropdown-item">
                  <span className="dropdown-item-icon">🧘</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Recovery & Mobility</p>
                    <p className="dropdown-item-subtitle">Improve flexibility & recovery</p>
                  </div>
                </a>
              </div>
              <div className="dropdown-section">
                <div className="dropdown-section-label">Format</div>
                <a href="#one-on-one" className="dropdown-item">
                  <span className="dropdown-item-icon">👨‍🏫</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">1-on-1 Sessions</p>
                    <p className="dropdown-item-subtitle">Personalized training</p>
                  </div>
                </a>
                <a href="#group-classes" className="dropdown-item">
                  <span className="dropdown-item-icon">👫</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Group Classes</p>
                    <p className="dropdown-item-subtitle">Train with others</p>
                  </div>
                </a>
                <a href="#online-programs" className="dropdown-item">
                  <span className="dropdown-item-icon">💻</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Online Programs</p>
                    <p className="dropdown-item-subtitle">Train from anywhere</p>
                  </div>
                </a>
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
                <a href="#client-reviews" className="dropdown-item">
                  <span className="dropdown-item-icon">⭐</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Client Reviews</p>
                    <p className="dropdown-item-subtitle">Read success stories</p>
                  </div>
                </a>
                <a href="#transformations" className="dropdown-item">
                  <span className="dropdown-item-icon">🔄</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Transformations</p>
                    <p className="dropdown-item-subtitle">Before & after results</p>
                  </div>
                </a>
                <a href="#video-stories" className="dropdown-item">
                  <span className="dropdown-item-icon">🎥</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Video Stories</p>
                    <p className="dropdown-item-subtitle">Watch client videos</p>
                  </div>
                </a>
                <a href="#leave-review" className="dropdown-item">
                  <span className="dropdown-item-icon">💬</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Leave a Review</p>
                    <p className="dropdown-item-subtitle">Share your experience</p>
                  </div>
                </a>
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
                <a href="#find-us" className="dropdown-item">
                  <span className="dropdown-item-icon">📍</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Find Us</p>
                    <p className="dropdown-item-subtitle">Visit our location</p>
                  </div>
                </a>
                <a href="#call-us" className="dropdown-item">
                  <span className="dropdown-item-icon">☎️</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Call Us</p>
                    <p className="dropdown-item-subtitle">Speak with our team</p>
                  </div>
                </a>
                <a href="#email-us" className="dropdown-item">
                  <span className="dropdown-item-icon">✉️</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Email Us</p>
                    <p className="dropdown-item-subtitle">Send us a message</p>
                  </div>
                </a>
                <a href="#book-session" className="dropdown-item">
                  <span className="dropdown-item-icon">📅</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Book a Session</p>
                    <p className="dropdown-item-subtitle">Schedule your training</p>
                  </div>
                </a>
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
    </nav>
  );
}
