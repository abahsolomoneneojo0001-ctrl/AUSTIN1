import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X, MapPin, Phone, Mail, Calendar } from 'lucide-react';
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

// Brand Information
const BRAND_INFO = {
  name: 'AUSTIN FITNESS',
  tagline: 'Transform Your Body, Transform Your Life',
  description: 'Premier fitness training and coaching services',
  contact: {
    phone: '(555) 123-4567',
    email: 'info@austinfitness.com',
    address: '123 Fitness Boulevard, Austin, TX 78701'
  },
  social: {
    instagram: '@austinfitness',
    facebook: 'Austin Fitness',
    twitter: '@austinfitness'
  }
};

// Website Content
const WEBSITE_CONTENT = {
  hero: {
    headline: 'Transform Your Body. Elevate Your Mind.',
    subtext: 'At FitWithAustin, fitness is more than workouts — it\'s a lifestyle. Whether you\'re starting your journey or pushing toward new goals, we\'re here to guide, motivate, and celebrate every step with you.'
  },
  about: {
    story: 'Founded by Austin, a passionate trainer dedicated to holistic health, FitWithAustin was built to inspire people to move, eat well, and live fully. We believe fitness should be accessible, enjoyable, and empowering.',
    mission: 'To create a supportive community where individuals achieve their best selves through personalized training, nutrition guidance, and motivation.'
  },
  trainings: {
    personal: 'One-on-one sessions tailored to your goals, from weight loss to strength building.',
    group: 'High-energy workouts designed to keep you motivated and connected.',
    functional: 'Improve mobility, endurance, and everyday strength with dynamic routines.'
  },
  memberships: {
    basic: 'Access to gym facilities and group classes.',
    premium: 'Includes personal training sessions and nutrition guidance.',
    elite: 'Full package with unlimited classes, advanced coaching, and exclusive events.'
  },
  testimonials: [
    { quote: 'Joining FitWithAustin changed my life. I\'ve lost 20 pounds and gained confidence I never thought possible.', author: 'Sarah M.' },
    { quote: 'Austin\'s approach is motivating and practical. I feel stronger every day.', author: 'James T.' }
  ],
  club: 'Step inside our modern facility equipped with state-of-the-art machines, functional training zones, and a welcoming atmosphere. More than a gym — it\'s a community.',
  contactCTA: 'Have questions or ready to start? Reach out today and let\'s build your fitness journey together.'
};

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

    // Check if this is static content or needs AI generation
    let content = '';
    
    try {
      // Map content based on title
      switch(title) {
        case 'Our Story':
          content = WEBSITE_CONTENT.about.story;
          break;
        case 'Our Mission':
          content = WEBSITE_CONTENT.about.mission;
          break;
        case 'Strength & Conditioning':
          content = WEBSITE_CONTENT.trainings.personal;
          break;
        case 'Group Classes':
          content = WEBSITE_CONTENT.trainings.group;
          break;
        case 'Recovery & Mobility':
          content = WEBSITE_CONTENT.trainings.functional;
          break;
        case 'Client Reviews':
          content = WEBSITE_CONTENT.testimonials.map(t => `"${t.quote}"\n— ${t.author}`).join('\n\n');
          break;
        case 'Tour The Club':
          content = WEBSITE_CONTENT.club;
          break;
        case 'Our Community':
          content = WEBSITE_CONTENT.club;
          break;
        case 'Meet the Team':
          // Generate AI content for this
          const context = `Provide detailed information about "${subtitle}". Keep it concise (2-3 paragraphs), practical, and specific.`;
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
          );
          const response = await Promise.race([
            askFitnessCoach(context),
            timeoutPromise
          ]) as string;
          content = response;
          break;
        default:
          // Generate AI content for unmapped items
          const aiContext = `Provide detailed, actionable fitness advice about "${subtitle}". Keep it concise (2-3 paragraphs), practical, and specific.`;
          const aiTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
          );
          const aiResponse = await Promise.race([
            askFitnessCoach(aiContext),
            aiTimeout
          ]) as string;
          content = aiResponse;
      }

      setModal(prev => ({
        ...prev,
        content: content || 'No content available',
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

  const handleContactAction = (type: 'phone' | 'email' | 'location' | 'calendar') => {
    switch(type) {
      case 'phone':
        window.location.href = `tel:${BRAND_INFO.contact.phone}`;
        break;
      case 'email':
        window.location.href = `mailto:${BRAND_INFO.contact.email}`;
        break;
      case 'location':
        window.open(`https://maps.google.com/?q=${encodeURIComponent(BRAND_INFO.contact.address)}`, '_blank');
        break;
      case 'calendar':
        // Placeholder for calendar booking integration
        alert('Schedule your training session! Coming soon: Calendar integration.');
        break;
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
        {/* Logo with Brand Info */}
        <a href="/" className="navbar-logo" title={BRAND_INFO.tagline}>
          <img src="/logo.jpeg" alt={`${BRAND_INFO.name} - ${BRAND_INFO.tagline}`} />
          <div className="logo-text-wrapper" style={{ display: 'flex', flexDirection: 'column', marginLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold', lineHeight: '1' }}>{BRAND_INFO.name}</span>
            <span style={{ fontSize: '0.625rem', color: '#666', lineHeight: '1.2' }}>{BRAND_INFO.tagline}</span>
          </div>
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
                <div className="dropdown-section-label">{BRAND_INFO.name}</div>
                <button className="dropdown-item" aria-label="Learn our fitness story">
                  <span className="dropdown-item-icon">📖</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Our Story</p>
                    <p className="dropdown-item-subtitle">Founded with passion for fitness</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Our mission statement">
                  <span className="dropdown-item-icon">🎯</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Our Mission</p>
                    <p className="dropdown-item-subtitle">Build a supportive community</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Meet expert coaches and trainers">
                  <span className="dropdown-item-icon">👥</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Meet the Team</p>
                    <p className="dropdown-item-subtitle">Expert coaches & trainers</p>
                  </div>
                </button>
              </div>
              <div className="dropdown-section">
                <div className="dropdown-section-label">Why Choose Us</div>
                <div className="dropdown-section-info">
                  <p className="text-sm text-slate-600 mb-2">✓ Expert certified trainers</p>
                  <p className="text-sm text-slate-600 mb-2">✓ Personalized training programs</p>
                  <p className="text-sm text-slate-600">✓ AI-powered fitness guidance</p>
                </div>
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
                <button className="dropdown-item" aria-label="One-on-one sessions tailored to your goals">
                  <span className="dropdown-item-icon">💪</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Strength & Conditioning</p>
                    <p className="dropdown-item-subtitle">Weight loss to strength building</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="High-energy workouts to stay motivated">
                  <span className="dropdown-item-icon">👫</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Group Classes</p>
                    <p className="dropdown-item-subtitle">Stay motivated and connected</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Improve mobility, endurance, and strength">
                  <span className="dropdown-item-icon">🧘</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Recovery & Mobility</p>
                    <p className="dropdown-item-subtitle">Enhance flexibility & recovery</p>
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
                    <p className="dropdown-item-subtitle">Real transformation stories</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="See transformation results from members">
                  <span className="dropdown-item-icon">🔄</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Success Stories</p>
                    <p className="dropdown-item-subtitle">See the results members achieved</p>
                  </div>
                </button>
              </div>
            </div>
          </li>

          {/* Facility */}
          <li className="nav-item-wrapper">
            <button className="nav-item-link" data-dropdown="facility">
              <span>The Club</span>
              <svg className="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-section">
                <div className="dropdown-section-label">Our Facility</div>
                <button className="dropdown-item" aria-label="Tour our modern gym facility">
                  <span className="dropdown-item-icon">🏢</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Tour The Club</p>
                    <p className="dropdown-item-subtitle">State-of-the-art equipment & zones</p>
                  </div>
                </button>
                <button className="dropdown-item" aria-label="Learn about our community">
                  <span className="dropdown-item-icon">👥</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Our Community</p>
                    <p className="dropdown-item-subtitle">More than just a gym</p>
                  </div>
                </button>
              </div>
              <div className="dropdown-section">
                <div className="dropdown-section-label">Amenities</div>
                <div className="dropdown-section-info">
                  <p className="text-sm text-slate-600 mb-2">✓ Modern cardio & strength equipment</p>
                  <p className="text-sm text-slate-600 mb-2">✓ Functional training zones</p>
                  <p className="text-sm text-slate-600">✓ Welcoming, inclusive atmosphere</p>
                </div>
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
                <button 
                  className="dropdown-item" 
                  aria-label="Find our gym location"
                  onClick={() => handleContactAction('location')}
                >
                  <span className="dropdown-item-icon">📍</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Find Us</p>
                    <p className="dropdown-item-subtitle">{BRAND_INFO.contact.address}</p>
                  </div>
                </button>
                <button 
                  className="dropdown-item" 
                  aria-label="Call us for more information"
                  onClick={() => handleContactAction('phone')}
                >
                  <span className="dropdown-item-icon">☎️</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Call Us</p>
                    <p className="dropdown-item-subtitle">{BRAND_INFO.contact.phone}</p>
                  </div>
                </button>
                <button 
                  className="dropdown-item" 
                  aria-label="Send us an email"
                  onClick={() => handleContactAction('email')}
                >
                  <span className="dropdown-item-icon">✉️</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Email Us</p>
                    <p className="dropdown-item-subtitle">{BRAND_INFO.contact.email}</p>
                  </div>
                </button>
                <button 
                  className="dropdown-item" 
                  aria-label="Schedule a training session"
                  onClick={() => handleContactAction('calendar')}
                >
                  <span className="dropdown-item-icon">📅</span>
                  <div className="dropdown-item-content">
                    <p className="dropdown-item-title">Book a Session</p>
                    <p className="dropdown-item-subtitle">Schedule your training</p>
                  </div>
                </button>
              </div>
              <div className="dropdown-section">
                <div className="dropdown-section-label">Follow Us</div>
                <div className="dropdown-section-info">
                  <p className="text-sm text-slate-600 mb-2">{BRAND_INFO.social.instagram}</p>
                  <p className="text-sm text-slate-600">{BRAND_INFO.social.facebook}</p>
                </div>
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
