// Shared deterministic rules. The server and local co-op use the same generator;
// no configuration or objective-completion message is accepted from clients.
export function validateComposition(players) {
  const roles = players.map((p) => (typeof p === "string" ? p : p.role)),
    unique = new Set(roles);
  const count = roles.length;
  const message =
    count === 2
      ? "Two-player missions require a Hacker and an Assassin."
      : count === 3
        ? "Three-player missions require Hacker, Assassin, and either Scout or Decoy."
        : "Four-player missions require all four unique roles.";
  const valid =
    count >= 2 &&
    count <= 4 &&
    unique.size === count &&
    unique.has("Hacker") &&
    unique.has("Assassin") &&
    (count === 2 ||
      (count === 3 && (unique.has("Scout") || unique.has("Decoy"))) ||
      (count === 4 && unique.has("Scout") && unique.has("Decoy")));
  const required =
    count === 4
      ? ["Hacker", "Assassin", "Scout", "Decoy"]
      : ["Hacker", "Assassin"];
  const missing = required.filter((r) => !unique.has(r));
  if (count === 3 && !unique.has("Scout") && !unique.has("Decoy"))
    missing.push("Scout or Decoy");
  return {
    valid,
    message: valid ? "Composition ready." : message,
    missing,
    duplicates: roles.filter((r, i) => roles.indexOf(r) !== i),
  };
}
const freeze = (x) => {
  for (const v of Object.values(x)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(x);
};
export function createMissionConfig(roster, level) {
  const result = validateComposition(roster);
  if (!result.valid) throw Error(result.message);
  if (new Set(roster.map((p) => p.id)).size !== roster.length)
    throw Error("Duplicate participant identity");
  const roles = roster.map((p) => p.role),
    scout = roles.includes("Scout"),
    decoy = roles.includes("Decoy");
  const anchors = level.mission.coop;
  if (!anchors) throw Error("This level has no cooperative mission anchors");
  const conditions = {
    credential: "assassin_takedown_of_designated_guard",
    electronic_key: "hacker_interaction_in_range_and_line_of_sight",
    recon: "scout_pulse_in_zone_and_detection_radius",
    checkpoint: "decoy_investigation_movement_then_teammate_interaction",
    security: "hacker_terminal_with_live_support_and_all_role_prerequisites",
    vault: "lock_interaction_after_security_shutdown",
    artifact: "pickup_inside_unlocked_vault",
    extract:
      "all_fixed_participants_at_van_with_artifact_and_required_objectives",
  };
  const objective = (
    id,
    role,
    label,
    prerequisites = [],
    visibility = "visible",
  ) => ({
    id,
    requiredRole: role,
    label,
    prerequisites,
    visibility,
    condition: conditions[id],
  });
  const objectives = [
    objective("credential", "Assassin", "Assassin: stun the security captain"),
    objective(
      "electronic_key",
      "Hacker",
      "Hacker: activate ALPHA in the Kitchen",
    ),
  ];
  if (scout)
    objectives.push(
      objective(
        "recon",
        "Scout",
        "Scout: pulse from the Garage recon zone",
        [],
        "zone",
      ),
    );
  const access = objectives.map((o) => o.id);
  if (decoy)
    objectives.push(
      objective(
        "checkpoint",
        "Decoy",
        "Decoy: lure sentry; Hacker/Assassin: release checkpoint",
        access,
      ),
    );
  const mandatory = objectives.map((o) => o.id);
  objectives.push(
    objective(
      "security",
      "Hacker",
      "Hacker: terminal + teammate: support pad",
      mandatory,
    ),
    objective("vault", "Team", "Interact at the vault lock", ["security"]),
    objective("artifact", "Team", "Recover the Diamond", ["vault"]),
    objective("extract", "Team", "Extract every operative with the Diamond", [
      "artifact",
      ...mandatory,
    ]),
  );
  return freeze({
    version: 2,
    mapId: level.id,
    variant:
      roster.length === 2
        ? "Operation Duo"
        : roster.length === 3
          ? `Operation Trio · ${scout ? "Recon" : "Distraction"}`
          : "Operation Full Squad",
    participants: roster.map((p) => ({ id: p.id, role: p.role })),
    objectives,
    mandatory,
    anchors: JSON.parse(
      JSON.stringify({
        captainId: anchors.captainId,
        ...(scout
          ? { reconZone: anchors.reconZone, hiddenNode: anchors.hiddenNode }
          : {}),
        ...(decoy
          ? {
              checkpointGuardId: anchors.checkpointGuardId,
              checkpoint: anchors.checkpoint,
              distractionZone: anchors.distractionZone,
            }
          : {}),
      }),
    ),
    balance: {
      quietRecoveryDelay: 3,
      quietRecoveryRate: 2,
      stunDuration: 10,
      captainStunDuration: 20,
      scanRadius: 120,
      reconZoneRadius: 58,
      noiseZoneRadius: 44,
      noiseDuration: 12,
      checkpointWindow: 10,
      checkpointClearance: 95,
    },
  });
}
export function requiredMissionsComplete(state) {
  const m = state.mission;
  if (!m?.config) return true;
  return (
    m.config.mandatory.every(
      (id) => m.objectives.find((o) => o.id === id)?.status === "complete",
    ) &&
    m.config.participants.length === state.players.length &&
    m.config.participants.every((a) =>
      state.players.some((p) => p.id === a.id && p.role === a.role),
    )
  );
}
