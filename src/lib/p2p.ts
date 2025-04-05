import Peer, { DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

// Types d'événements P2P
export enum P2PEventType {
  MOVE = 'move',
  CHAT = 'chat',
  GAME_OVER = 'gameOver',
  RESIGN = 'resign',
  DRAW_OFFER = 'drawOffer',
  DRAW_ACCEPT = 'drawAccept',
  DRAW_DECLINE = 'drawDecline',
  RECONNECT = 'reconnect',
  CONNECTION_STATUS = 'connectionStatus'
}

// Interface des messages P2P
export interface P2PMessage {
  type: P2PEventType;
  data: any;
  timestamp: number;
}

// Interface pour les callbacks d'évènements P2P
export interface P2PCallbacks {
  onMove?: (move: string) => void;
  onChat?: (message: string, sender: string) => void;
  onGameOver?: (result: string) => void;
  onResign?: () => void;
  onDrawOffer?: () => void;
  onDrawAccept?: () => void;
  onDrawDecline?: () => void;
  onConnect?: (peerId: string) => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onConnectionStatus?: (status: 'connecting' | 'connected' | 'disconnected') => void;
}

// Classe de gestionnaire P2P pour les parties en ligne
export class P2PManager {
  private peer: Peer | null = null;
  private connections: Record<string, DataConnection> = {};
  private callbacks: P2PCallbacks = {};
  private peerId: string;
  private username: string;

  constructor(username: string, callbacks: P2PCallbacks = {}) {
    this.peerId = uuidv4();
    this.username = username;
    this.callbacks = callbacks;
  }

  // Initialiser la connexion peer
  public init(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(this.peerId);

        this.peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          this.setupPeerEvents();
          resolve(id);
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          if (this.callbacks.onError) this.callbacks.onError(err);
          reject(err);
        });
      } catch (error) {
        console.error('Failed to initialize P2P connection', error);
        reject(error);
      }
    });
  }

  // Configurer les événements du peer
  private setupPeerEvents(): void {
    if (!this.peer) return;

    this.peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      this.handleConnection(conn);
    });
  }

  // Gérer une nouvelle connexion
  private handleConnection(conn: DataConnection): void {
    this.connections[conn.peer] = conn;

    conn.on('open', () => {
      console.log('Connection established with:', conn.peer);
      if (this.callbacks.onConnect) this.callbacks.onConnect(conn.peer);
      if (this.callbacks.onConnectionStatus) this.callbacks.onConnectionStatus('connected');
    });

    conn.on('data', (data) => {
      this.handleMessage(data as P2PMessage, conn.peer);
    });

    conn.on('close', () => {
      console.log('Connection closed with:', conn.peer);
      delete this.connections[conn.peer];
      if (this.callbacks.onDisconnect) this.callbacks.onDisconnect();
      if (this.callbacks.onConnectionStatus) this.callbacks.onConnectionStatus('disconnected');
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      if (this.callbacks.onError) this.callbacks.onError(err);
    });
  }

  // Se connecter à un pair distant
  public connect(remotePeerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('P2P not initialized'));
        return;
      }

      if (this.callbacks.onConnectionStatus) this.callbacks.onConnectionStatus('connecting');

      try {
        const conn = this.peer.connect(remotePeerId);
        
        conn.on('open', () => {
          this.handleConnection(conn);
          resolve();
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          if (this.callbacks.onError) this.callbacks.onError(err);
          reject(err);
        });
      } catch (error) {
        console.error('Failed to connect to remote peer', error);
        reject(error);
      }
    });
  }

  // Traiter un message reçu
  private handleMessage(message: P2PMessage, senderId: string): void {
    console.log('Received message:', message, 'from:', senderId);

    switch (message.type) {
      case P2PEventType.MOVE:
        if (this.callbacks.onMove) this.callbacks.onMove(message.data);
        break;
      case P2PEventType.CHAT:
        if (this.callbacks.onChat) this.callbacks.onChat(message.data, senderId);
        break;
      case P2PEventType.GAME_OVER:
        if (this.callbacks.onGameOver) this.callbacks.onGameOver(message.data);
        break;
      case P2PEventType.RESIGN:
        if (this.callbacks.onResign) this.callbacks.onResign();
        break;
      case P2PEventType.DRAW_OFFER:
        if (this.callbacks.onDrawOffer) this.callbacks.onDrawOffer();
        break;
      case P2PEventType.DRAW_ACCEPT:
        if (this.callbacks.onDrawAccept) this.callbacks.onDrawAccept();
        break;
      case P2PEventType.DRAW_DECLINE:
        if (this.callbacks.onDrawDecline) this.callbacks.onDrawDecline();
        break;
      case P2PEventType.CONNECTION_STATUS:
        if (this.callbacks.onConnectionStatus) this.callbacks.onConnectionStatus(message.data);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // Envoyer un message à tous les pairs connectés
  public sendMessage(type: P2PEventType, data: any): void {
    const message: P2PMessage = {
      type,
      data,
      timestamp: Date.now()
    };

    Object.values(this.connections).forEach(conn => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  // Envoyer un coup
  public sendMove(move: string): void {
    this.sendMessage(P2PEventType.MOVE, move);
  }

  // Envoyer un message de chat
  public sendChat(message: string): void {
    this.sendMessage(P2PEventType.CHAT, message);
  }

  // Abandonner la partie
  public resign(): void {
    this.sendMessage(P2PEventType.RESIGN, null);
  }

  // Proposer nulle
  public offerDraw(): void {
    this.sendMessage(P2PEventType.DRAW_OFFER, null);
  }

  // Accepter nulle
  public acceptDraw(): void {
    this.sendMessage(P2PEventType.DRAW_ACCEPT, null);
  }

  // Refuser nulle
  public declineDraw(): void {
    this.sendMessage(P2PEventType.DRAW_DECLINE, null);
  }

  // Obtenir l'ID du pair
  public getPeerId(): string {
    return this.peerId;
  }

  // Fermer toutes les connexions
  public disconnect(): void {
    Object.values(this.connections).forEach(conn => {
      conn.close();
    });
    this.connections = {};
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  // Mettre à jour les callbacks
  public updateCallbacks(callbacks: P2PCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}
