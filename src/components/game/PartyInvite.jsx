import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
export default function PartyInvite({ net }) {
  const [qr, setQr] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    setQr("");
    if (net.inviteLink)
      QRCode.toDataURL(net.inviteLink, {
        width: 320,
        margin: 3,
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) setQr(url);
        })
        .catch(() => setNotice("QR unavailable. Use the displayed link."));
    return () => {
      active = false;
    };
  }, [net.inviteLink]);
  const copy = async (roomOnly = false) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          roomOnly ? net.roomCode : net.inviteLink,
        );
        setNotice(roomOnly ? "Room code copied" : "Invite copied");
      } else setNotice("Select and copy the invite URL below.");
    } catch {
      setNotice("Select and copy the invite URL below.");
    }
  };
  const displayUrl = () =>
    `${new URL(net.inviteLink).origin}/display/${net.roomCode}#access=${net.displayKey}`;
  return (
    <section className="party-invite">
      <div className="section-label">NETWORK / INVITATION</div>
      <div className="room-code-row">
        <div>
          <span>ROOM CODE</span>
          <strong>{net.roomCode}</strong>
        </div>
        <button aria-label="Copy room code" onClick={() => copy(true)}>
          COPY
        </button>
      </div>
      <p className="ops-eyebrow">SCAN TO JOIN · NO APP NEEDED</p>
      {qr ? (
        <img
          className="party-qr"
          src={qr}
          alt={`QR invitation to room ${net.roomCode}`}
        />
      ) : (
        <div className="party-qr-placeholder">
          {net.inviteError || "Choose the host Wi-Fi address below."}
        </div>
      )}
      <a className="party-invite-url" href={net.inviteLink || undefined}>
        {net.inviteLink || "LAN address needed"}
      </a>
      <div className="ops-actions">
        <button onClick={() => copy(false)} disabled={!net.inviteLink}>
          COPY INVITE LINK
        </button>
        {net.displayKey && net.inviteLink && (
          <a
            className="party-button"
            href={displayUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            SHARED DISPLAY ↗
          </a>
        )}
      </div>
      <p className="ops-copy">
        LAN: {net.advertisedHost || "Choose an address"} · Room active
      </p>
      <details className="party-network-settings">
        <summary>NETWORK SETTINGS</summary>
        <label>
          ADVERTISED LAPTOP ADDRESS
          <input
            aria-label="Advertised LAN address"
            value={net.advertisedHost}
            onChange={(e) => net.setAdvertisedHost(e.target.value)}
          />
        </label>
        {net.lanAddresses.length > 0 && (
          <label>
            NETWORK INTERFACE
            <select
              aria-label="Network interface"
              value={net.advertisedHost}
              onChange={(e) => net.setAdvertisedHost(e.target.value)}
            >
              {net.lanAddresses.map((n) => (
                <option key={n.address} value={n.address}>
                  {n.name} · {n.address}
                </option>
              ))}
            </select>
          </label>
        )}
      </details>
      <p className="ops-copy">
        Use the same Wi-Fi or hotspot. VPNs and guest networks may block
        pairing. The QR gives player access only.
      </p>
      <p role="status" className="ops-copy">
        {notice}
      </p>
    </section>
  );
}
