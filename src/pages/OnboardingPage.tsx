import React, { useState } from 'react';
import './OnboardingPage.css';
import { useThemeContext } from '../context';
import type { OnboardingPreferences } from '../types/auth';

interface OnboardingPageProps {
  onComplete?: (userPreferences: OnboardingPreferences) => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { themeClassName } = useThemeContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    displayName: '',
    avatar: '',
    notifications: true,
    theme: 'auto' as 'light' | 'dark' | 'auto'
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to ShakeOnIt!',
      description: 'Let\'s get you set up with your new account'
    },
    {
      id: 'profile',
      title: 'Set up your profile',
      description: 'Tell us a bit about yourself'
    },
    {
      id: 'preferences',
      title: 'Customize your experience',
      description: 'Choose your notification and theme preferences'
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      description: 'Start connecting with your team'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="step-content">
            <div className="features-preview">
              <div className="feature-item">
                <span className="feature-icon">Chat</span>
                <span>Real-time messaging</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">Team</span>
                <span>Team collaboration</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">Notify</span>
                <span>Smart notifications</span>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="step-content">
            <div className="form-section">
              <div className="avatar-section">
                <div className="avatar-preview">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar preview" />
                  ) : (
                    <div className="avatar-placeholder">
                      {formData.displayName ? formData.displayName[0].toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <button type="button" className="btn btn-secondary btn-small">
                  Choose Avatar
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="How should others see your name?"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="step-content">
            <div className="form-section">
              <div className="preference-group">
                <h4>Notifications</h4>
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                      Enable desktop notifications for new messages
                    </span>
                  </label>
                </div>
              </div>

              <div className="preference-group">
                <h4>Theme Preference</h4>
                <div className="theme-options">
                  <label className={`theme-option ${formData.theme === 'light' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={formData.theme === 'light'}
                      onChange={handleInputChange}
                    />
                    <div className="theme-preview theme-light">
                      <div className="theme-header"></div>
                      <div className="theme-content"></div>
                    </div>
                    <span>Light</span>
                  </label>
                  
                  <label className={`theme-option ${formData.theme === 'dark' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={formData.theme === 'dark'}
                      onChange={handleInputChange}
                    />
                    <div className="theme-preview theme-dark">
                      <div className="theme-header"></div>
                      <div className="theme-content"></div>
                    </div>
                    <span>Dark</span>
                  </label>
                  
                  <label className={`theme-option ${formData.theme === 'auto' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="auto"
                      checked={formData.theme === 'auto'}
                      onChange={handleInputChange}
                    />
                    <div className="theme-preview theme-auto">
                      <div className="theme-header"></div>
                      <div className="theme-content"></div>
                    </div>
                    <span>Auto</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="step-content">
            <div className="completion-content">
              <div className="success-icon">Success!</div>
              <h3>Welcome aboard, {formData.displayName || 'there'}!</h3>
              <p>Your account is ready. You can now start messaging with your team and explore all the features.</p>
              <div className="next-steps">
                <div className="next-step-item">
                  <span className="step-number">1</span>
                  <span>Join or create your first channel</span>
                </div>
                <div className="next-step-item">
                  <span className="step-number">2</span>
                  <span>Invite team members to collaborate</span>
                </div>
                <div className="next-step-item">
                  <span className="step-number">3</span>
                  <span>Start messaging and sharing ideas</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    switch (steps[currentStep].id) {
      case 'profile':
        return !formData.displayName.trim();
      default:
        return false;
    }
  };

  return (
    <div className={`str-chat onboarding-page ${themeClassName}`}>
      <div className="onboarding-container">
        <div className="onboarding-card">
          <header className="onboarding-header">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <div className="step-info">
              <span className="step-counter">{currentStep + 1} of {steps.length}</span>
              <h2>{steps[currentStep].title}</h2>
              <p>{steps[currentStep].description}</p>
            </div>
          </header>

          <main className="onboarding-main">
            {renderStepContent()}
          </main>

          <footer className="onboarding-footer">
            <div className="button-group">
              {currentStep > 0 && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleBack}
                >
                  Back
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleNext}
                disabled={isNextDisabled()}
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;