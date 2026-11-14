import { useCallback, useEffect, useRef, useState } from "react";
import { clearKeys, clearTouchInput, getLanInput } from "@/lib/game/input";
import {
  createNetworkSession,
  makeWsUrl,
  sanitizeInputPayload,
} from "@/lib/game/networkClient";
import {
  endpointFromLocation,
  parseJoinLocation,
  createInviteUrl,
  validRoomCode,
} from "@/lib/party/invitations";
import {
  readSession,
  saveSession,
  forgetSession,
} from "@/lib/party/sessionStore";
import { createInputPump } from "@/lib/party/controllerInput";
const activeStorage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};
const empty = () => ({
  mode: "local",
  kind: null,
  myPlayerId: null,
  session: null,
  snapshot: null,
  latest: null,
  paused: false,
});
export function useLanMultiplayer({ onGameStart, onLobby, onEnd }) {
  const networkRef = useRef(empty());
  const callbacks = useRef({ onGameStart, onLobby, onEnd });
  callbacks.current = { onGameStart, onLobby, onEnd };
  const initial = useRef(parseJoinLocation(window.location));
  const [joinCode, setJoinCode] = useState(initial.current.code);
  const [wsUrl, setWsUrl] = useState(endpointFromLocation(window.location));
  const [nickname, setNickname] = useState("");
  const [selectedRole, setSelectedRole] = useState("Assassin");
  const [viewMode, setViewMode] = useState(
    initial.current.kind === "display" ? "display" : "controller",
  );
  const [roomCode, setRoomCode] = useState("");
  const [kind, setKind] = useState(null);
  const [players, setPlayers] = useState([]);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [netStatus, setNetStatus] = useState("Not connected");
  const [netError, setNetError] = useState(
    initial.current.valid
      ? ""
      : "Invalid invite. Enter a six-character room code.",
  );
  const [lanMaxPlayers, setLanMaxPlayers] = useState(4);
  const [lanAddresses, setLanAddresses] = useState([]);
  const [advertisedHost, setAdvertisedHost] = useState("");
  const [displayKey, setDisplayKey] = useState("");
  const [displayCount, setDisplayCount] = useState(0);
  const [liveState, setLiveState] = useState(null);
  const [discoveredRooms, setDiscoveredRooms] = useState([]);
  const connection = useRef({
    manual: true,
    timer: null,
    interval: null,
    credentials: null,
    deadline: 0,
    generation: 0,
  });
  const lastUI = useRef(0),
    ended = useRef(false);
  const persist = useCallback(() => {
    const c = connection.current;
    if (c.credentials)
      saveSession(activeStorage(), {
        ...c.credentials,
        url: c.url,
        kind: c.kind,
        viewMode: c.viewMode || "controller",
      });
  }, []);
  const clearInput = useCallback(() => {
    clearKeys();
    clearTouchInput();
  }, []);
  const disconnect = useCallback(
    (explicit = false) => {
      const c = connection.current;
      c.manual = true;
      c.generation++;
      clearTimeout(c.timer);
      clearInterval(c.interval);
      clearInput();
      if (explicit) {
        networkRef.current.session?.send("leave");
        forgetSession(activeStorage());
        c.credentials = null;
      }
      networkRef.current.session?.close();
      networkRef.current = empty();
    },
    [clearInput],
  );
  const cleanupNetwork = useCallback(() => disconnect(true), [disconnect]);
  const resetLobbyUi = useCallback(() => {
    setViewMode("controller");
    setDisplayKey("");
    setMyPlayerId(null);
    setHostId(null);
    setAdvertisedHost("");
    setLanAddresses([]);
    setDisplayCount(0);
    setRoomCode("");
    setKind(null);
    setPlayers([]);
    setLiveState(null);
    setNetError("");
    setNetStatus("Not connected");
  }, []);
  const connect = useCallback(
    (action, payload = {}, stored = null) => {
      disconnect(false);
      const c = connection.current;
      c.manual = false;
      c.deadline = Date.now() + 30000;
      c.url = stored?.url || makeWsUrl(wsUrl);
      c.kind =
        stored?.kind ||
        (action === "party_create"
          ? "host"
          : action === "display_join"
            ? "display"
            : "player");
      c.viewMode =
        action === "host_create" ? "game" : stored?.viewMode || viewMode;
      c.credentials = stored
        ? { roomCode: stored.roomCode, token: stored.token }
        : null;
      if (!stored) forgetSession(activeStorage());
      setViewMode(c.kind === "player" ? c.viewMode : "display");
      setNetError("");
      setNetStatus(stored ? "Restoring your session…" : "Connecting…");
      ended.current = false;
      const generation = c.generation;
      function open(resuming = false) {
        if (c.manual || generation !== c.generation) return;
        if (resuming && Date.now() > c.deadline) {
          setNetError("Connection expired. Leave and join a new room.");
          setNetStatus("Offline");
          return;
        }
        const session = createNetworkSession(c.url, {
          onOpen: () => {
            if (resuming && c.credentials)
              session.send(
                c.kind === "host"
                  ? "host_resume"
                  : c.kind === "display"
                    ? "display_join"
                    : "resume",
                c.credentials,
              );
            else session.send(action, payload);
          },
          onError: (message) =>
            setNetError(
              `${message} Check host address, firewall, and Wi-Fi client isolation.`,
            ),
          onClose: () => {
            if (
              c.manual ||
              generation !== c.generation ||
              networkRef.current.session !== session
            )
              return;
            clearInput();
            if (!c.reconnecting) {
              c.deadline = Date.now() + 30000;
              c.reconnecting = true;
            }
            networkRef.current.paused = true;
            setNetStatus("Reconnecting…");
            setNetError(
              "Disconnected. Mission pauses for missing players for up to 30s.",
            );
            if (c.credentials) c.timer = setTimeout(() => open(true), 800);
          },
          onMessage: (msg) => {
            if (generation !== c.generation) return;
            const net = networkRef.current;
            if (
              [
                "room_created",
                "joined_room",
                "host_connected",
                "display_connected",
              ].includes(msg.type)
            ) {
              c.kind =
                msg.type === "host_connected"
                  ? "host"
                  : msg.type === "display_connected"
                    ? "display"
                    : "player";
              c.reconnecting = false;
              net.kind = c.kind;
              net.mode = "server";
              net.myPlayerId = msg.playerId || null;
              net.paused = false;
              c.deadline = Date.now() + 30000;
              c.credentials = {
                roomCode: msg.roomCode,
                token:
                  msg.sessionToken || payload.token || c.credentials?.token,
              };
              setKind(c.kind);
              setLanMaxPlayers(msg.maxPlayers);
              setRoomCode(msg.roomCode);
              setMyPlayerId(net.myPlayerId);
              setHostId(msg.hostId);
              setLanAddresses(msg.lanAddresses || []);
              const hostname = new URL(c.url).hostname;
              setAdvertisedHost(
                (old) =>
                  old ||
                  (!["localhost", "127.0.0.1"].includes(hostname)
                    ? hostname
                    : msg.serverIp),
              );
              if (msg.displayKey) setDisplayKey(msg.displayKey);
              setNetStatus("Connected");
              setNetError("");
              persist();
              callbacks.current.onLobby();
            }
            if (msg.type === "host_access") setDisplayKey(msg.displayKey);
            if (msg.type === "roster_update") {
              setLanMaxPlayers(msg.maxPlayers);
              setPlayers(msg.players);
              setHostId(msg.hostId);
              setDisplayCount(msg.displayCount || 0);
            }
            if (msg.type === "game_start") {
              ended.current = false;
              net.latest = msg.state;
              net.snapshot = msg.state;
              setLiveState(msg.state);
              callbacks.current.onGameStart(msg.state);
            }
            if (msg.type === "snapshot") {
              net.snapshot = msg.state;
              net.latest = msg.state;
              net.paused = msg.paused;
              c.deadline = Date.now() + 30000;
              if (
                Date.now() - lastUI.current > 90 ||
                msg.state.screen !== "playing"
              ) {
                lastUI.current = Date.now();
                setLiveState(msg.state);
              }
              if (
                ["win", "loss"].includes(msg.state.screen) &&
                !ended.current
              ) {
                ended.current = true;
                clearInput();
                callbacks.current.onEnd(msg.state);
              }
            }
            if (msg.type === "lobby_return") {
              net.latest = null;
              net.snapshot = null;
              ended.current = false;
              clearInput();
              setLiveState(null);
              callbacks.current.onLobby();
            }
            if (msg.type === "room_closed") {
              net.paused = true;
              setNetError(msg.message);
              setNetStatus("Room closed");
              forgetSession(activeStorage());
              c.credentials = null;
              c.manual = true;
              clearInput();
            }
            if (msg.type === "join_error") {
              setNetError(msg.message);
              if (resuming && /active/.test(msg.message)) {
                session.close();
                return;
              }
              if (resuming) {
                c.credentials = null;
                forgetSession(activeStorage());
                setNetStatus("Session expired");
              }
            }
            if (msg.type === "rooms_discovered")
              setDiscoveredRooms(msg.rooms || []);
          },
        });
        networkRef.current.session = session;
      }
      open(!!stored);
      const pump = createInputPump({
        read: () => sanitizeInputPayload(getLanInput()),
        send: (input) =>
          networkRef.current.session?.send("client_input", { input }),
        isActive: () =>
          networkRef.current.kind === "player" &&
          networkRef.current.latest?.screen === "playing" &&
          !networkRef.current.paused &&
          !document.hidden,
      });
      c.interval = setInterval(() => {
        if (
          networkRef.current.kind === "player" &&
          networkRef.current.latest?.screen === "playing"
        )
          pump.tick();
      }, 33);
    },
    [disconnect, wsUrl, viewMode, clearInput, persist],
  );
  const connectRef = useRef(connect);
  connectRef.current = connect;
  const boot = useRef(false);
  useEffect(() => {
    if (boot.current) return;
    boot.current = true;
    const saved = readSession(activeStorage());
    if (
      saved &&
      (!initial.current.code || saved.roomCode === initial.current.code)
    ) {
      connect("resume", {}, saved);
      return;
    }
    if (initial.current.kind === "display" && initial.current.valid) {
      const key = new URLSearchParams(window.location.hash.slice(1)).get(
        "access",
      );
      if (key)
        connect("display_join", { roomCode: initial.current.code, token: key });
      else
        setNetError(
          "Open Shared Display from the host to authorize this screen.",
        );
    }
  }, [connect]);
  useEffect(() => {
    const release = () => {
      clearInput();
      const net = networkRef.current;
      if (net.kind === "player" && net.latest?.screen === "playing")
        net.session?.send("client_input", {
          input: sanitizeInputPayload({ ability: false }),
        });
    };
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", release);
    const unload = () => disconnect(false);
    window.addEventListener("pagehide", unload);
    // BFCache restoration needs a fresh connection; an ordinary refresh uses sessionStorage.
    const restore = (e) => {
      if (e.persisted) {
        const saved = readSession(activeStorage());
        if (saved) connectRef.current("resume", {}, saved);
      }
    };
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", release);
      window.removeEventListener("pagehide", unload);
      window.removeEventListener("pageshow", restore);
      disconnect(false);
    };
  }, [clearInput, disconnect]);
  const changeViewMode = (mode) => {
    clearInput();
    if (
      networkRef.current.kind === "player" &&
      networkRef.current.latest?.screen === "playing"
    )
      networkRef.current.session?.send("client_input", {
        input: sanitizeInputPayload({ ability: false }),
      });
    setViewMode(mode);
    connection.current.viewMode = mode;
    persist();
  };
  let inviteLink = "",
    inviteError = "";
  if (roomCode && advertisedHost) {
    try {
      inviteLink = createInviteUrl({
        host: advertisedHost,
        roomCode,
        port: Number(window.location.port || 5173),
        secure: window.location.protocol === "https:",
      });
    } catch (e) {
      inviteError = e.message;
    }
  }
  const hostLanGame = (party = true) =>
    connect(party ? "party_create" : "host_create", {
      maxPlayers: lanMaxPlayers,
      ...(!party ? { nickname: nickname || "Host", role: selectedRole } : {}),
    });
  const joinLanGame = () => {
    if (!validRoomCode(joinCode.trim()))
      return setNetError("Enter a valid six-character room code.");
    if (!nickname.trim()) return setNetError("Enter your nickname first.");
    connect("join_room", {
      roomCode: joinCode.trim(),
      nickname: nickname.trim(),
      role: selectedRole,
    });
  };
  const sendLobby = (type, payload) =>
    networkRef.current.session?.send(type, payload);
  const discoverLanGames = () => {
    const session = createNetworkSession(makeWsUrl(wsUrl), {
      onOpen: () => session.send("discover_rooms"),
      onError: () => setNetError("Cannot reach the host server."),
      onMessage: (msg) => {
        if (msg.type === "rooms_discovered")
          setDiscoveredRooms(msg.rooms || []);
        session.close();
      },
    });
  };
  return {
    networkRef,
    joinCode,
    setJoinCode,
    wsUrl,
    setWsUrl,
    nickname,
    setNickname,
    selectedRole,
    setSelectedRole,
    viewMode,
    changeViewMode,
    roomCode,
    kind,
    players,
    myPlayerId,
    hostId,
    netStatus,
    netError,
    lanMaxPlayers,
    setLanMaxPlayers,
    lanAddresses,
    advertisedHost,
    setAdvertisedHost,
    inviteLink,
    inviteError,
    displayKey,
    displayCount,
    liveState,
    discoveredRooms,
    hostLanGame,
    joinLanGame,
    discoverLanGames,
    sendLobby,
    cleanupNetwork,
    resetLobbyUi,
    clearInput,
  };
}
