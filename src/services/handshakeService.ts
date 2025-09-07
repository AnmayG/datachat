interface HandshakeEvent {
  id: string;
  type: 'wave' | 'high_five' | 'fist_bump' | 'peace' | 'thumbs_up' | 'detected';
  from_uid: string;
  from_name: string;
  from_wallet_address?: string; // Add wallet address to the event
  to_uid?: string;
  message?: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface ActiveUser {
  uid: string;
  name: string;
  last_seen: number;
  is_shaking: boolean;
  handshake_type?: string;
}

interface HandshakeResponse {
  message?: string;
  error?: string;
  event_id?: string;
}

interface ActiveUsersResponse {
  users: ActiveUser[];
  total_count: number;
}

export class HandshakeService {
  private baseUrl: string;
  private socket: WebSocket | null = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private eventListeners: Set<(event: HandshakeEvent) => void> = new Set();
  private activeUsersListeners: Set<(users: ActiveUser[]) => void> = new Set();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  // constructor(baseUrl: string = 'https://api-datachat.loca.lt') {
  //   this.baseUrl = baseUrl;
  // }

  constructor(baseUrl: string = 'https://tucson-mar-single-foul.trycloudflare.com') {
    this.baseUrl = baseUrl;
  }

  // Connect to handshake WebSocket
  connect(userId: string, userName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.userId = userId;
      this.userName = userName;

      // Convert https to wss for WebSocket URL
      const wsUrl = this.baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      const socketUrl = `${wsUrl}/handshake/ws?uid=${userId}&name=${encodeURIComponent(userName)}`;

      this.socket = new WebSocket(socketUrl);

      this.socket.onopen = () => {
        console.log('Handshake WebSocket connected');
        this.notifyConnectionListeners(true);
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data: HandshakeEvent = JSON.parse(event.data);
          this.notifyEventListeners(data);
        } catch (error) {
          console.error('Failed to parse handshake event:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('Handshake WebSocket disconnected');
        this.notifyConnectionListeners(false);
        this.socket = null;
      };

      this.socket.onerror = (error) => {
        console.error('Handshake WebSocket error:', error);
        this.notifyConnectionListeners(false);
        reject(error);
      };
    });
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.userId = null;
    this.userName = null;
  }

  // Send handshake event
  async sendHandshake(type: HandshakeEvent['type'], targetUserId?: string, message?: string, location?: { latitude: number; longitude: number }, walletAddress?: string): Promise<HandshakeResponse> {
    if (!this.userId) {
      throw new Error('Must be connected to send handshake');
    }

    const payload = {
      type,
      to_uid: targetUserId,
      message,
      location,
      from_wallet_address: walletAddress // Include wallet address in payload
    };

    try {
      const response = await fetch(`${this.baseUrl}/handshake/send?uid=${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send handshake: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error sending handshake:', error);
      throw error;
    }
  }

  // Get active users
  async getActiveUsers(): Promise<ActiveUser[]> {
    try {
      const response = await fetch(`${this.baseUrl}/handshake/active`);
      
      if (!response.ok) {
        throw new Error(`Failed to get active users: ${response.status}`);
      }

      const data: ActiveUsersResponse = await response.json();
      this.notifyActiveUsersListeners(data.users);
      return data.users;
    } catch (error) {
      console.error('Error getting active users:', error);
      throw error;
    }
  }

  // Event listeners
  onHandshakeEvent(listener: (event: HandshakeEvent) => void) {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  onActiveUsersUpdate(listener: (users: ActiveUser[]) => void) {
    this.activeUsersListeners.add(listener);
    return () => this.activeUsersListeners.delete(listener);
  }

  onConnectionChange(listener: (connected: boolean) => void) {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  // Helper methods
  private notifyEventListeners(event: HandshakeEvent) {
    this.eventListeners.forEach(listener => listener(event));
  }

  private notifyActiveUsersListeners(users: ActiveUser[]) {
    this.activeUsersListeners.forEach(listener => listener(users));
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // Get current user info
  getCurrentUser() {
    return {
      userId: this.userId,
      userName: this.userName
    };
  }
}

export const handshakeService = new HandshakeService();
