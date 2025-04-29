import { toast } from "@/hooks/use-toast";
import { Repository, branches, commits, files, pullRequests, repositories } from "./database";

// Types for P2P events
type PeerInfo = {
  id: string;
  username: string;
  online: boolean;
  lastSeen?: Date;
};

type SyncStatus = {
  progress: number;
  repositoryId: number;
  repositoryName: string;
  peerCount: number;
  timeRemaining?: number;
};

type ConnectionStats = {
  connected: boolean;
  peers: PeerInfo[];
  bandwidthUp: number;
  bandwidthDown: number;
  latency: number;
};

// Event emitter for P2P events
class P2PEventEmitter {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
    return this;
  }
}

// Mock P2P client implementation
class P2PClient extends P2PEventEmitter {
  private static instance: P2PClient;
  private connectionStatus: ConnectionStats;
  private currentSyncs: Map<number, SyncStatus>;
  private mockPeers: PeerInfo[];

  private constructor() {
    super();
    this.connectionStatus = {
      connected: false,
      peers: [],
      bandwidthUp: 0,
      bandwidthDown: 0,
      latency: 0
    };
    this.currentSyncs = new Map();
    this.mockPeers = [
      { id: 'peer1', username: 'alice', online: true },
      { id: 'peer2', username: 'bob', online: true },
      { id: 'peer3', username: 'charlie', online: false, lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    ];
  }

  static getInstance(): P2PClient {
    if (!P2PClient.instance) {
      P2PClient.instance = new P2PClient();
    }
    return P2PClient.instance;
  }

  // Connect to the P2P network
  async connect(): Promise<boolean> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update connection status
    this.connectionStatus.connected = true;
    this.connectionStatus.peers = this.mockPeers.filter(p => p.online);
    this.connectionStatus.bandwidthUp = Math.floor(Math.random() * 100);
    this.connectionStatus.bandwidthDown = Math.floor(Math.random() * 100);
    this.connectionStatus.latency = Math.floor(Math.random() * 50);
    
    // Emit connection event
    this.emit('connected', this.connectionStatus);
    
    return true;
  }

  // Disconnect from the P2P network
  async disconnect(): Promise<boolean> {
    // Simulate disconnection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update connection status
    this.connectionStatus.connected = false;
    this.connectionStatus.peers = [];
    
    // Emit disconnection event
    this.emit('disconnected');
    
    return true;
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStats {
    return { ...this.connectionStatus };
  }

  // Sync a repository with the network
  async syncRepository(repositoryId: number): Promise<boolean> {
    const repository = await repositories.getById(repositoryId);
    if (!repository) {
      throw new Error('Repository not found');
    }
    
    // Check if already syncing
    if (this.currentSyncs.has(repositoryId)) {
      return false;
    }
    
    // Create sync status
    const syncStatus: SyncStatus = {
      progress: 0,
      repositoryId,
      repositoryName: repository.name,
      peerCount: Math.floor(Math.random() * 3) + 1,
      timeRemaining: Math.floor(Math.random() * 60) + 30
    };
    
    this.currentSyncs.set(repositoryId, syncStatus);
    this.emit('syncStarted', syncStatus);
    
    // Simulate sync progress
    const interval = setInterval(() => {
      const currentStatus = this.currentSyncs.get(repositoryId);
      if (!currentStatus) {
        clearInterval(interval);
        return;
      }
      
      // Update progress
      currentStatus.progress += Math.random() * 10;
      currentStatus.timeRemaining = Math.max(0, (currentStatus.timeRemaining || 0) - 5);
      
      // Emit progress event
      this.emit('syncProgress', { ...currentStatus });
      
      // If completed
      if (currentStatus.progress >= 100) {
        currentStatus.progress = 100;
        currentStatus.timeRemaining = 0;
        this.emit('syncCompleted', { ...currentStatus });
        this.currentSyncs.delete(repositoryId);
        clearInterval(interval);
        
        // Notify via toast
        toast({
          title: "Sync completed",
          description: `Repository "${repository.name}" has been successfully synced.`
        });
      }
    }, 2000);
    
    return true;
  }

  // Get sync status for a repository
  getSyncStatus(repositoryId: number): SyncStatus | undefined {
    return this.currentSyncs.get(repositoryId);
  }

  // Get all active syncs
  getAllSyncs(): SyncStatus[] {
    return Array.from(this.currentSyncs.values());
  }

  // Mock finding peers for a specific repository
  async findPeersForRepository(repositoryId: number): Promise<PeerInfo[]> {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a random subset of peers
    return this.mockPeers
      .filter(() => Math.random() > 0.3)
      .map(peer => ({ ...peer }));
  }

  // Mock sending a pull request to a peer
  async sendPullRequest(pullRequestId: number, peerId: string): Promise<boolean> {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 80% chance of success
    const success = Math.random() > 0.2;
    
    if (success) {
      this.emit('pullRequestSent', { pullRequestId, peerId });
    }
    
    return success;
  }
}

// Export singleton instance
export const p2pClient = P2PClient.getInstance();

// Export types
export type { PeerInfo, SyncStatus, ConnectionStats };
