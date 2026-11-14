import { useCallback, useRef, useState } from "react";
import { clearTouchInput } from "@/lib/game/input";
import { createNetworkSession, makeWsUrl } from "@/lib/game/networkClient";
const empty = () => ({
  mode: "local",
  myPlayerId: 1,
  session: null,
  snapshot: null,
  paused: false,
});
export function useLanMultiplayer({
  screenRef,
  startNetworkGame,
  onPeerLeftToMenu,
}) {
  const networkRef = useRef(empty());
  const callbacks = useRef({ startNetworkGame, onPeerLeftToMenu });
  callbacks.current = { startNetworkGame, onPeerLeftToMenu };
  const [joinCode, setJoinCode] = useState("");
  const [wsUrl, setWsUrl] = useState(makeWsUrl(""));
  const [netStatus, setNetStatus] = useState("");
  const [netError, setNetError] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [serverIp, setServerIp] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [lanMaxPlayers, setLanMaxPlayers] = useState(4);
  const [discoveredRooms, setDiscoveredRooms] = useState([]);
  const [players, setPlayers] = useState([]);
  const [myPlayerId, setMyPlayerId] = useState(1);
  const [hostId, setHostId] = useState(1);
  const retry = useRef(null);
  const reconnectDeadline = useRef(0);
  const credentials = useRef(null);
  const manualClose = useRef(false);
  const cleanupNetwork = useCallback(() => {
    manualClose.current = true;
    clearTimeout(retry.current);
    reconnectDeadline.current = 0;
    credentials.current = null;
    networkRef.current.session?.send("leave");
    networkRef.current.session?.close();
    networkRef.current = empty();
    clearTouchInput();
  }, []);
  const resetLobbyUi = useCallback(() => {
    setRoomCode("");
    setServerIp("");
    setJoinCode("");
    setNetStatus("");
    setNetError("");
    setInviteLink("");
    setDiscoveredRooms([]);
    setPlayers([]);
  }, []);
  const connectNetwork = useCallback(
    (mode, code) => {
      cleanupNetwork();
      manualClose.current = false;
      setNetError("");
      setNetStatus("Connecting…");
      function open(resuming = false) {
        if (resuming && Date.now() >= reconnectDeadline.current) {
          credentials.current = null;
          setNetError('Connection could not be restored. Leave the operation to create a new room.');
          return;
        }
        const session = createNetworkSession(makeWsUrl(wsUrl), {
          onOpen: () => {
            if (resuming && credentials.current)
              session.send("resume", credentials.current);
            else
              session.send(
                mode === "host" ? "host_create" : "join_room",
                mode === "host"
                  ? { maxPlayers: lanMaxPlayers }
                  : { roomCode: code },
              );
          },
          onError: (msg) => setNetError(msg),
          onClose: () => {
            if (manualClose.current || networkRef.current.session !== session)
              return;
            if (!reconnectDeadline.current) reconnectDeadline.current = Date.now() + 30000;
            networkRef.current.paused = true;
            setNetError("Disconnected. Reconnecting for up to 30 seconds…");
            if (credentials.current)
              retry.current = setTimeout(() => open(true), 1000);
          },
          onMessage: (msg) => {
            const net = networkRef.current;
            if (["room_created", "joined_room"].includes(msg.type)) {
              net.mode = "server";
              net.myPlayerId = msg.playerId;
              net.paused = false;
              reconnectDeadline.current = 0;
              credentials.current = {
                roomCode: msg.roomCode,
                token: msg.sessionToken,
              };
              setMyPlayerId(msg.playerId);
              setHostId(msg.hostId);
              setRoomCode(msg.roomCode);
              setServerIp(msg.serverIp || "");
              const webHost = new URL(makeWsUrl(wsUrl)).hostname;
              setInviteLink(
                `${window.location.protocol}//${webHost}:${window.location.port || 5173}/?room=${msg.roomCode}`,
              );
              setNetError("");
              setNetStatus("Connected. Choose a role and ready up.");
            }
            if (msg.type === "roster_update") {
              setPlayers(msg.players);
              setHostId(msg.hostId);
            }
            if (msg.type === "game_start") {
              callbacks.current.startNetworkGame(
                "server",
                msg.playerIds,
                msg.state,
              );
              net.snapshot = msg.state;
            }
            if (msg.type === "snapshot") {
              net.snapshot = msg.state;
              net.paused = msg.paused;
              setNetError(
                msg.paused
                  ? "Teammate disconnected. Mission frozen for reconnection."
                  : "",
              );
            }
            if (msg.type === "join_error") {
              setNetError(msg.message);
              if (resuming) {
                credentials.current = null;
                manualClose.current = true;
                setNetStatus(
                  "Session expired. Return to menu and join a new room.",
                );
              }
            }
            if (msg.type === "rooms_discovered")
              setDiscoveredRooms(msg.rooms || []);
          },
        });
        networkRef.current.session = session;
      }
      open();
    },
    [cleanupNetwork, lanMaxPlayers, wsUrl],
  );
  const hostLanGame = () => connectNetwork("host");
  const joinLanGame = () => {
    if (!joinCode.trim()) return setNetError("Enter room code first.");
    connectNetwork("client", joinCode.trim().toUpperCase());
  };
  const discoverLanGames = () => {
    if (roomCode) return;
    const session = createNetworkSession(makeWsUrl(wsUrl), {
      onOpen: () => session.send("discover_rooms"),
      onError: () => setNetError("Cannot reach this server."),
      onMessage: (msg) => {
        if (msg.type === "rooms_discovered") {
          setDiscoveredRooms(msg.rooms);
          setNetStatus("Rooms on the selected server");
        }
        session.close();
      },
    });
  };
  const sendLobby = (type, payload) =>
    networkRef.current.session?.send(type, payload);
  return {
    networkRef,
    joinCode,
    setJoinCode,
    wsUrl,
    setWsUrl,
    netStatus,
    netError,
    roomCode,
    serverIp,
    inviteLink,
    lanMaxPlayers,
    setLanMaxPlayers,
    discoveredRooms,
    players,
    myPlayerId,
    hostId,
    cleanupNetwork,
    resetLobbyUi,
    hostLanGame,
    joinLanGame,
    discoverLanGames,
    sendLobby,
  };
}
