import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import LoginPage from "./LoginPage";
import { useThemeContext } from "../context";
import type { PeraWalletConnect } from '@perawallet/connect';
import type { UserInfo } from "../types/auth";
import { mockChatBubbles } from "../constants/mockData";

interface LandingPageProps {
  onLogin?: (userInfo: UserInfo) => void;
  connectedWallet: string | null;
  peraWallet: PeraWalletConnect;
  setConnectedWallet: (wallet: string | null) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin: appOnLogin, connectedWallet, peraWallet, setConnectedWallet }) => {
  const { themeClassName } = useThemeContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalAnimationClass, setModalAnimationClass] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (showLoginModal) {
      const timer = setTimeout(() => {
        setModalAnimationClass("show");
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setModalAnimationClass("");
      return () => {}; // Return empty cleanup function
    }
  }, [showLoginModal]);

  const handleLogin = (userInfo: UserInfo) => {
    
    // Call the app's authentication handler first
    if (appOnLogin) {
      appOnLogin(userInfo);
    }
    
    setShowLoginModal(false);
    // Handle login success - navigate to chat since onboarding is completed during authentication
    navigate("/chat");
  };

  return (
    <div className={`str-chat x-homepage ${themeClassName}`}>
      <div className="x-container">
        <div className="x-left">
          <div className="chat-bubbles-container">
            {mockChatBubbles.map((bubble) => (
              <div 
                key={bubble.id} 
                className={`floating-chat-bubble ${bubble.className} ${bubble.isTyping ? 'typing-indicator' : ''}`}
                style={{
                  animationDelay: bubble.animationDelay,
                  zIndex: bubble.zIndex
                }}
              >
                <div className="chat-bubble-avatar">
                  <img src={bubble.user.image} alt={bubble.user.alt} className="user-avatar" />
                </div>
                <div className="chat-bubble-content">
                  <div className="chat-bubble-name">{bubble.user.name}</div>
                  {bubble.isTyping ? (
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <>
                      <div className="chat-bubble-message">{bubble.message}</div>
                      <div className="chat-bubble-time">{bubble.time}</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="x-right">
          <div className="x-content">
            <h1 className="x-title">ShakeOnIt</h1>
            <h2 className="x-subtitle">
              Shake your hands. We'll boast for you.
            </h2>
            <div className="x-auth-buttons">
              <div className="x-main-buttons">
                <button
                  className="x-btn x-btn-getstarted"
                  onClick={() => {
                    setShowLoginModal(true);
                  }}
                >
                  Get Started
                </button>
              </div>

              <p className="x-terms">
                Connect your Algorand wallet to get started with ShakeOnIt.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="x-footer">
        <div className="x-footer-links">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="x-footer-link"
          >
            Github Source
          </a>
          <button className="x-footer-link" onClick={() => alert('Coming soon!')}>
            How It Works
          </button>
          <span className="x-footer-copyright">© 2025 DataChat.</span>
        </div>
      </footer>

      {showLoginModal && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setShowLoginModal(false)}
          />
          <div className={`login-modal ${modalAnimationClass}`}>
            <LoginPage onLogin={handleLogin} connectedWallet={connectedWallet} peraWallet={peraWallet} setConnectedWallet={setConnectedWallet} onClose={() => setShowLoginModal(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default LandingPage;
