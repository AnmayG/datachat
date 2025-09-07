import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../context';
import { handshakeService } from '../services/handshakeService';
import './HandshakePage.css';

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  magnitude: number;
}

interface HandshakeEvent {
  id: string;
  type: 'wave' | 'high_five' | 'fist_bump' | 'peace' | 'thumbs_up' | 'detected';
  from_uid: string;
  from_name: string;
  to_uid?: string;
  message?: string;
  timestamp: number;
}

interface ActiveUser {
  uid: string;
  name: string;
  last_seen: number;
  is_shaking: boolean;
  handshake_type?: string;
}

interface HandshakePageProps {
  user?: { id: string; name?: string; image?: string } | null;
}

const HandshakePage: React.FC<HandshakePageProps> = ({ user }) => {
  const { themeClassName } = useThemeContext();
  const navigate = useNavigate();
  
  // Detection algorithm parameters
  const MAGNITUDE_THRESHOLD = 15;
  const REQUIRED_PEAKS = 3;
  const PEAK_COOLDOWN = 200; // ms between peak detections
  const PEAK_WINDOW = 2000; // ms window for consecutive peaks
  const HANDSHAKE_END_TIMEOUT = 1000; // ms to wait after last peak before ending handshake

  // Buffer size for data storage  
  const BUFFER_SIZE = 100;
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [handshakeDetected, setHandshakeDetected] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState<AccelerometerData[]>([]);
  const [magnitude, setMagnitude] = useState(0);
  const [peakCount, setPeakCount] = useState(0);
  const [isHandshaking, setIsHandshaking] = useState(false);

  // Handshake events state
  const [isConnectedToHandshake, setIsConnectedToHandshake] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [recentEvents, setRecentEvents] = useState<HandshakeEvent[]>([]);
  
  // Track users who have shaken hands recently (last 10 seconds)
  const getRecentlyActiveUsers = () => {
    const now = Date.now();
    const recentThreshold = 10000; // 10 seconds
    
    console.log('getRecentlyActiveUsers called');
    console.log('Current time:', now);
    console.log('Recent events:', recentEvents);
    
    const recentSenders = recentEvents
      .filter(event => {
        // Handle both milliseconds and seconds timestamps
        let eventTime = event.timestamp;
        if (eventTime < 1000000000000) { // If timestamp is in seconds, convert to milliseconds
          eventTime = eventTime * 1000;
        }
        
        const isRecent = now - eventTime < recentThreshold;
        console.log(`Event from ${event.from_name} at ${event.timestamp} (converted: ${eventTime}), age: ${now - eventTime}ms, isRecent: ${isRecent}`);
        return isRecent;
      })
      .map(event => ({
        uid: event.from_uid,
        name: event.from_name,
        handshake_type: event.type,
        timestamp: event.timestamp
      }))
      .reduce((acc, user) => {
        // Keep only the most recent handshake per user
        if (!acc[user.uid] || acc[user.uid].timestamp < user.timestamp) {
          acc[user.uid] = user;
        }
        return acc;
      }, {} as Record<string, { uid: string; name: string; handshake_type: string; timestamp: number }>);
    
    const result = Object.values(recentSenders);
    console.log('getRecentlyActiveUsers result:', result);
    return result;
  };
  
  const dataBufferRef = useRef<AccelerometerData[]>([]);
  const lastPeakTimeRef = useRef(0);
  const handshakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const peakCountRef = useRef(0);

  // Ensure page is scrollable
  useEffect(() => {
    // Add class to body to enable scrolling
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.height = 'auto';
      rootElement.style.overflow = 'auto';
    }

    return () => {
      // Restore original styles when leaving the page
      document.body.style.overflow = '';
      document.body.style.height = '';
      if (rootElement) {
        rootElement.style.height = '';
        rootElement.style.overflow = '';
      }
    };
  }, []);

  // Calculate magnitude from accelerometer data
  const calculateMagnitude = useCallback((x: number, y: number, z: number): number => {
    return Math.sqrt(x * x + y * y + z * z);
  }, []);

  // Detect peaks in accelerometer data and count consecutive peaks
  const detectPeak = useCallback((currentMagnitude: number): boolean => {
    const now = Date.now();
    
    // Check if magnitude exceeds threshold and enough time has passed since last peak
    if (currentMagnitude > MAGNITUDE_THRESHOLD && 
        now - lastPeakTimeRef.current > PEAK_COOLDOWN) {
      
      lastPeakTimeRef.current = now;
      peakCountRef.current += 1;
      setPeakCount(peakCountRef.current);
      
      console.log(`Peak detected! Count: ${peakCountRef.current}, Magnitude: ${currentMagnitude.toFixed(2)}`);
      
      // Check if we've reached the required number of peaks
      if (peakCountRef.current >= REQUIRED_PEAKS && !isHandshaking) {
        console.log('Handshake detected - consecutive peaks reached!');
        setIsHandshaking(true);
        setHandshakeDetected(true);
        
        // Clear any existing timeout
        if (handshakeTimeoutRef.current) {
          clearTimeout(handshakeTimeoutRef.current);
        }
        
        // Set timeout to return to idle state after handshake completion
        handshakeTimeoutRef.current = setTimeout(() => {
          console.log('Handshake completed - returning to idle state');
          setIsHandshaking(false);
          setHandshakeDetected(false);
          peakCountRef.current = 0;
          setPeakCount(0);
        }, HANDSHAKE_END_TIMEOUT);
      }
      
      // Reset handshake end timeout - user is still shaking
      if (handshakeTimeoutRef.current) {
        clearTimeout(handshakeTimeoutRef.current);
      }
      
      // Set timeout to end handshake if no more peaks
      handshakeTimeoutRef.current = setTimeout(() => {
        console.log('Handshake ended - returning to idle state');
        setIsHandshaking(false);
        setHandshakeDetected(false);
        peakCountRef.current = 0;
        setPeakCount(0);
      }, HANDSHAKE_END_TIMEOUT);
      
      return true;
    }
    
    // Reset peak count if too much time has passed without reaching required peaks
    if (peakCountRef.current > 0 && peakCountRef.current < REQUIRED_PEAKS && 
        now - lastPeakTimeRef.current > PEAK_WINDOW) {
      console.log('Peak window expired, resetting count');
      peakCountRef.current = 0;
      setPeakCount(0);
    }
    
    return false;
  }, [MAGNITUDE_THRESHOLD, PEAK_COOLDOWN, REQUIRED_PEAKS, PEAK_WINDOW, HANDSHAKE_END_TIMEOUT, isHandshaking]);

  // Handle device motion events
  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (!event.accelerationIncludingGravity) return;

    const { x, y, z } = event.accelerationIncludingGravity;
    if (x === null || y === null || z === null) return;

    const timestamp = Date.now();
    const currentMagnitude = calculateMagnitude(x, y, z);
    
    const newData: AccelerometerData = {
      x: x || 0,
      y: y || 0,
      z: z || 0,
      timestamp,
      magnitude: currentMagnitude
    };

    // Update buffer
    dataBufferRef.current.push(newData);
    if (dataBufferRef.current.length > BUFFER_SIZE) {
      dataBufferRef.current.shift();
    }

    // Update state
    setAccelerometerData([...dataBufferRef.current]);
    setMagnitude(currentMagnitude);

    // Detect handshake
    if (isDetecting) {
      const isPeak = detectPeak(currentMagnitude);
      
      if (isPeak) {
        const currentTime = Date.now();
        const timeSinceLastPeak = currentTime - lastPeakTimeRef.current;
        
        // If enough time has passed since last peak, count this as a new peak
        if (timeSinceLastPeak > PEAK_COOLDOWN) {
          peakCountRef.current += 1;
          setPeakCount(peakCountRef.current);
          lastPeakTimeRef.current = currentTime;
          
          console.log(`Peak detected! Count: ${peakCountRef.current}, Magnitude: ${currentMagnitude.toFixed(2)}`);
          
          // Start handshake state after first peak
          if (peakCountRef.current === 1) {
            setIsHandshaking(true);
            console.log('Handshake started!');
            
            // Set timeout to reset if no more peaks detected
            if (handshakeTimeoutRef.current) {
              clearTimeout(handshakeTimeoutRef.current);
            }
            handshakeTimeoutRef.current = setTimeout(() => {
              setIsHandshaking(false);
              setPeakCount(0);
              peakCountRef.current = 0;
              console.log('Handshake timeout - resetting');
            }, HANDSHAKE_END_TIMEOUT);
          }
          
          // Check if we have enough peaks for a complete handshake
          if (peakCountRef.current >= REQUIRED_PEAKS) {
            setHandshakeDetected(true);
            setIsDetecting(false);
            setIsHandshaking(false);
            console.log(`🎉 Handshake detected! ${peakCountRef.current} peaks detected`);
            
            // Clear handshake timeout
            if (handshakeTimeoutRef.current) {
              clearTimeout(handshakeTimeoutRef.current);
            }
          } else if (peakCountRef.current > 1) {
            // Reset handshake timeout for additional peaks
            if (handshakeTimeoutRef.current) {
              clearTimeout(handshakeTimeoutRef.current);
            }
            handshakeTimeoutRef.current = setTimeout(() => {
              setIsHandshaking(false);
              setPeakCount(0);
              peakCountRef.current = 0;
              console.log('Handshake timeout - resetting');
            }, HANDSHAKE_END_TIMEOUT);
          }
        }
      }
    }
  }, [isDetecting, calculateMagnitude, detectPeak]);

  // Request permission for device motion
  const requestPermission = async () => {
    try {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        // iOS 13+ devices
        const permission = await (DeviceMotionEvent as any).requestPermission();
        const granted = permission === 'granted';
        setHasPermission(granted);
        
        // Auto-start detection when permission is granted
        if (granted) {
          setIsDetecting(true);
          setHandshakeDetected(false);
          setIsHandshaking(false);
          setPeakCount(0);
          peakCountRef.current = 0;
          dataBufferRef.current = [];
          lastPeakTimeRef.current = 0;
        }
      } else {
        // Android and older iOS devices
        setHasPermission(true);
        
        // Auto-start detection for Android/older iOS
        setIsDetecting(true);
        setHandshakeDetected(false);
        setIsHandshaking(false);
        setPeakCount(0);
        peakCountRef.current = 0;
        dataBufferRef.current = [];
        lastPeakTimeRef.current = 0;
      }
    } catch (error) {
      console.error('Error requesting device motion permission:', error);
      setHasPermission(false);
    }
  };

  // Set up device motion listener
  useEffect(() => {
    if (hasPermission) {
      window.addEventListener('devicemotion', handleDeviceMotion);
      return () => {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      };
    }
    return () => {
      // No cleanup needed if no permission
    };
  }, [hasPermission, handleDeviceMotion]);

  // Auto-start detection when permission is granted
  useEffect(() => {
    if (hasPermission && !isDetecting) {
      setIsDetecting(true);
      setHandshakeDetected(false);
      setIsHandshaking(false);
      setPeakCount(0);
      peakCountRef.current = 0;
      dataBufferRef.current = [];
      lastPeakTimeRef.current = 0;
      console.log('Auto-starting detection with permissions');
    }
  }, [hasPermission, isDetecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (handshakeTimeoutRef.current) {
        clearTimeout(handshakeTimeoutRef.current);
      }
    };
  }, []);

  // Connect to handshake service
  useEffect(() => {
    // Use actual user data if available, otherwise fallback to generated values
    const userId = user?.id || 'user-' + Math.random().toString(36).substr(2, 9);
    const userName = user?.name || 'Anonymous User';
    
    // Connect to handshake service
    handshakeService.connect(userId, userName)
      .then(() => {
        setIsConnectedToHandshake(true);
        console.log('Connected to handshake service as:', userName);
        
        // Load initial active users
        handshakeService.getActiveUsers().catch(console.error);
      })
      .catch((error) => {
        console.error('Failed to connect to handshake service:', error);
        setIsConnectedToHandshake(false);
      });

    // Set up event listeners
    const unsubscribeEvents = handshakeService.onHandshakeEvent((event) => {
      console.log('Received handshake event:', event);
      setRecentEvents(prev => {
        const newEvents = [event, ...prev].slice(0, 10);
        console.log('Updated recent events:', newEvents);
        return newEvents;
      });
    });

    const unsubscribeUsers = handshakeService.onActiveUsersUpdate((users) => {
      setActiveUsers(users);
    });

    const unsubscribeConnection = handshakeService.onConnectionChange((connected) => {
      setIsConnectedToHandshake(connected);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeEvents();
      unsubscribeUsers();
      unsubscribeConnection();
      handshakeService.disconnect();
    };
  }, [user]);

  // Periodically refresh active users
  useEffect(() => {
    if (!isConnectedToHandshake) return;

    const interval = setInterval(() => {
      handshakeService.getActiveUsers().catch(console.error);
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isConnectedToHandshake]);

  // Send handshake event when motion handshake is detected
  useEffect(() => {
    if (handshakeDetected && isConnectedToHandshake) {
      console.log('Sending detected handshake event');
      handshakeService.sendHandshake('detected', undefined, `Motion detected with ${peakCount} peaks`)
        .then(() => {
          console.log('Handshake event sent successfully');
        })
        .catch((error) => {
          console.error('Failed to send handshake event:', error);
        });
    }
  }, [handshakeDetected, isConnectedToHandshake, peakCount]);

  // Manual handshake sending
  const sendManualHandshake = async () => {
    if (!isConnectedToHandshake) {
      console.error('Not connected to handshake service');
      return;
    }

    try {
      await handshakeService.sendHandshake('detected', undefined, 'Manual handshake');
      console.log('Sent manual handshake');
    } catch (error) {
      console.error('Failed to send manual handshake:', error);
    }
  };

  // Get handshake type emoji
  const getHandshakeEmoji = (type: string) => {
    switch (type) {
      case 'wave': return '👋';
      case 'high_five': return '🙏';
      case 'fist_bump': return '👊';
      case 'peace': return '✌️';
      case 'thumbs_up': return '👍';
      case 'detected': return '🤝';
      default: return '👋';
    }
  };

  return (
    <div className={`handshake-page ${themeClassName}`}>
      <div className="handshake-container">
        <header className="handshake-header">
          <button
            className="back-button"
            onClick={() => navigate('/chat')}
          >
            ← Back to Chat
          </button>
          <h1>Handshake Detection</h1>
        </header>

        <div className="handshake-content">
          {hasPermission === null && (
            <div className="permission-section">
              <h2>Motion Permission Required</h2>
              <p>This feature requires access to your device's motion sensors to detect handshakes.</p>
              <button 
                className="btn btn-primary"
                onClick={requestPermission}
              >
                Grant Permission
              </button>
            </div>
          )}

          {hasPermission === false && (
            <div className="permission-section error">
              <h2>Permission Denied</h2>
              <p>Motion sensor access is required for handshake detection. Please enable it in your browser settings.</p>
            </div>
          )}

          {hasPermission === true && (
            <>
              <div className="detection-section">
                <div className="status-display">
                  {handshakeDetected ? (
                    <div className="handshake-success">
                      <div className="success-icon">🤝</div>
                      <h2>Handshake Detected!</h2>
                      <p>Great! A handshake motion was detected with {peakCount} peaks.</p>
                      <small>Detection continues automatically...</small>
                    </div>
                  ) : isHandshaking ? (
                    <div className="handshaking-state">
                      <div className="pulse-animation">🤝</div>
                      <h2>Handshake in Progress...</h2>
                      <p>Keep shaking! Detected {peakCount} of {REQUIRED_PEAKS} required peaks</p>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(peakCount / REQUIRED_PEAKS) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="detecting-state">
                      <div className="pulse-animation">📱</div>
                      <h2>Listening for Handshakes...</h2>
                      <p>Shake your device to simulate a handshake motion</p>
                      {peakCount > 0 && (
                        <div className="peak-count">
                          <small>Peaks detected: {peakCount}</small>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="control-info">
                  <p className="detection-status">
                    🟢 Detection is running continuously
                  </p>
                </div>
              </div>

              <div className="data-section">
                <h3>Sensor Data</h3>
                <div className="sensor-readings">
                  <div className="magnitude-display">
                    <strong>Magnitude: </strong>
                    <span className={magnitude > MAGNITUDE_THRESHOLD ? 'threshold-exceeded' : ''}>
                      {magnitude.toFixed(2)}
                    </span>
                    <small> (threshold: {MAGNITUDE_THRESHOLD})</small>
                  </div>
                  
                  {accelerometerData.length > 0 && (
                    <div className="latest-reading">
                      <div><strong>X:</strong> {accelerometerData[accelerometerData.length - 1]?.x.toFixed(2)}</div>
                      <div><strong>Y:</strong> {accelerometerData[accelerometerData.length - 1]?.y.toFixed(2)}</div>
                      <div><strong>Z:</strong> {accelerometerData[accelerometerData.length - 1]?.z.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="handshake-events-section">
                <h3>Manual Handshake</h3>
                <div className="manual-handshake">
                  <div className="handshake-action">
                    <button 
                      onClick={sendManualHandshake}
                      className="btn btn-primary btn-large"
                      disabled={!isConnectedToHandshake}
                    >
                      🤝 Send Handshake
                    </button>
                  </div>
                  <p className="connection-status">
                    {isConnectedToHandshake ? '🟢 Connected to handshake service' : '🔴 Disconnected from handshake service'}
                  </p>
                </div>
              </div>

              <div className="active-users-section">
                <h3>Who's Shaking Hands Right Now</h3>
                <button onClick={() => console.log('Manual check:', getRecentlyActiveUsers())} style={{marginBottom: '10px'}}>
                  Debug: Check Active Users
                </button>
                <div className="active-users">
                  {getRecentlyActiveUsers().length === 0 ? (
                    <p className="no-users">No one is currently shaking hands</p>
                  ) : (
                    <div className="users-grid">
                      {getRecentlyActiveUsers().map((user) => (
                        <div key={user.uid} className="user-card shaking">
                          <div className="user-avatar">
                            {getHandshakeEmoji(user.handshake_type || 'wave')}
                          </div>
                          <div className="user-info">
                            <div className="user-name">{user.name}</div>
                            <div className="user-status">
                              Shaking: {user.handshake_type || 'unknown'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="recent-events-section">
                <h3>Recent Handshake Events</h3>
                <div className="events-list">
                  {recentEvents.length === 0 ? (
                    <p className="no-events">No recent handshake events</p>
                  ) : (
                    recentEvents.map((event) => (
                      <div key={event.id} className="event-item">
                        <div className="event-emoji">{getHandshakeEmoji(event.type)}</div>
                        <div className="event-details">
                          <div className="event-text">
                            <strong>{event.from_name}</strong> sent a {event.type}
                            {event.message && <span className="event-message">: "{event.message}"</span>}
                          </div>
                          <div className="event-time">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HandshakePage;
