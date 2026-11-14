import { useCallback, useRef, useState } from 'react';
import { clearNetworkInputs, clearTouchInput, getLanInput } from '@/lib/game/input';
import { createNetworkSession, makeWsUrl, sanitizeFramePayload, sanitizeInputPayload } from '@/lib/game/networkClient';

function createEmptyNetworkState() {
  return {
    mode: 'local',
    myPlayerId: 1,
    session: null,
    remoteInputs: {},
    frame: 0,
    queuedFrames: new Map(),
    nextClientFrame: 0,
  };
}

export function useLanMultiplayer({ screenRef, startNetworkGame, onPeerLeftToMenu }) {
  const networkRef = useRef(createEmptyNetworkState());

  const [wsUrl] = useState(makeWsUrl(''));
  const [joinCode, setJoinCode] = useState('');
  const [netStatus, setNetStatus] = useState('');
  const [netError, setNetError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [lanMaxPlayers, setLanMaxPlayers] = useState(4);
  const [discoveredRooms, setDiscoveredRooms] = useState([]);

  const cleanupNetwork = useCallback(() => {
    const net = networkRef.current;
    try { net.session?.close(); } catch {}
    networkRef.current = createEmptyNetworkState();
    clearNetworkInputs();
    clearTouchInput();
  }, []);

  const resetLobbyUi = useCallback(() => {
    setRoomCode('');
    setServerIp('');
    setJoinCode('');
    setNetStatus('');
    setNetError('');
    setInviteLink('');
    setDiscoveredRooms([]);
  }, []);

  const connectNetwork = useCallback((mode) => {
    cleanupNetwork();
    const url = makeWsUrl(wsUrl);
    setNetStatus(`Connecting to ${url} ...`);
    setNetError('');

    const session = createNetworkSession(url, {
      onOpen: () => {
        if (mode === 'host') {
          session.send('host_create', { maxPlayers: lanMaxPlayers });
          setNetStatus('Connected. Creating room...');
        } else {
          session.send('join_room', { roomCode: joinCode.trim().toUpperCase() });
          setNetStatus('Connected. Joining room...');
        }
      },
      onClose: () => {
        if (screenRef.current === 'playing' || screenRef.current === 'lobby') {
          setNetError('Connection closed.');
          setNetStatus('');
        }
      },
      onError: (msg) => setNetError(msg),
      onMessage: (msg) => {
        const net = networkRef.current;

        if (msg.type === 'room_created') {
          net.mode = 'host';
          net.myPlayerId = Number(msg.playerId || 1);
          setRoomCode(msg.roomCode || '');
          setServerIp(msg.serverIp || '');
          const port = window.location.port || '5173';
          setInviteLink(`http://${msg.serverIp}:${port}/?room=${msg.roomCode}`);
          setNetStatus('Room created. Share room code or invite link.');
        }

        if (msg.type === 'joined_room') {
          net.mode = 'client';
          net.myPlayerId = Number(msg.playerId || 2);
          setRoomCode(msg.roomCode || '');
          setNetStatus(`Joined room as Player ${net.myPlayerId}. Waiting for host...`);
        }

        if (msg.type === 'roster_update') {
          setNetStatus(`Players in lobby: ${(msg.players || []).join(', ')} / ${msg.maxPlayers || lanMaxPlayers}`);
        }

        if (msg.type === 'game_start') {
          startNetworkGame(net.mode === 'host' ? 'host' : 'client', msg.playerIds || [1, 2]);
        }

        if (msg.type === 'frame_inputs' && net.mode === 'client') {
          const payload = sanitizeFramePayload(msg);
          net.queuedFrames.set(payload.frame, payload);
        }

        if (msg.type === 'client_input' && net.mode === 'host') {
          net.remoteInputs[msg.playerId] = sanitizeInputPayload(msg.input);
        }

        if (msg.type === 'peer_left') {
          setNetError('Peer disconnected. Returning to menu.');
          setTimeout(() => onPeerLeftToMenu(), 1200);
        }

        if (msg.type === 'join_error') {
          setNetError(msg.message || 'Unable to join room.');
        }

        if (msg.type === 'rooms_discovered') {
          setDiscoveredRooms(msg.rooms || []);
          setNetStatus(`Found ${(msg.rooms || []).length} room(s).`);
        }
      },
    });

    networkRef.current.session = session;
  }, [cleanupNetwork, joinCode, lanMaxPlayers, onPeerLeftToMenu, screenRef, startNetworkGame, wsUrl]);

  const hostLanGame = useCallback(() => connectNetwork('host'), [connectNetwork]);

  const discoverLanGames = useCallback(() => {
    cleanupNetwork();
    const url = makeWsUrl('');
    setNetStatus('Scanning nearby sessions...');
    setNetError('');
    const session = createNetworkSession(url, {
      onOpen: () => session.send('discover_rooms', {}),
      onClose: () => {},
      onError: () => setNetError('Unable to scan for nearby sessions.'),
      onMessage: (msg) => {
        if (msg.type === 'rooms_discovered') {
          setDiscoveredRooms(msg.rooms || []);
          setNetStatus(`Found ${(msg.rooms || []).length} room(s).`);
        }
        session.close();
      },
    });
  }, [cleanupNetwork]);

  const joinLanGame = useCallback(() => {
    if (!joinCode.trim()) {
      setNetError('Enter room code first.');
      return;
    }
    connectNetwork('client');
  }, [connectNetwork, joinCode]);

  const buildHostInputs = useCallback(() => {
    const net = networkRef.current;
    return (players) => {
      const inputs = {};
      for (const p of players) {
        const pid = p.id;
        inputs[pid] = pid === net.myPlayerId
          ? sanitizeInputPayload(getLanInput())
          : sanitizeInputPayload(net.remoteInputs[pid] || { up: false, down: false, left: false, right: false, interact: false });
      }
      return inputs;
    };
  }, []);

  return {
    networkRef,
    joinCode,
    setJoinCode,
    netStatus,
    netError,
    roomCode,
    serverIp,
    inviteLink,
    lanMaxPlayers,
    setLanMaxPlayers,
    discoveredRooms,
    cleanupNetwork,
    resetLobbyUi,
    hostLanGame,
    discoverLanGames,
    joinLanGame,
    buildHostInputs,
  };
}

