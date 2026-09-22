export const PLANES = [
  { id: "00", name: "LOCAL", meaning: "This machine, this repo, this process." },
  { id: "01", name: "IDENTITY", meaning: "Identity Case fields supplied by the user." },
  { id: "02", name: "DISCOVERY", meaning: "Configured connectors only." },
  { id: "03", name: "EVIDENCE", meaning: "Hashed preservation chain." },
  { id: "04", name: "RESTORATION", meaning: "Plans and user-confirmed actions." },
  { id: "05", name: "REPUTATION", meaning: "Classification workspace, not legal verdicts." },
  { id: "06", name: "CONTINUITY", meaning: "Snapshots and project memory." },
  { id: "07", name: "INTEGRITY", meaning: "Hallmark, hashes, audit." },
  { id: "08", name: "ARCHIVE", meaning: "Exports and backups." },
  { id: "09", name: "MONITORING", meaning: "Factual runtime health." },
  { id: "10", name: "ZIONCORE", meaning: "Orchestration identity of this kernel." }
];

export function planeNote() {
  return {
    disclaimer:
      "Planes are software visualization layers for OmniRestore / MATRIX. They are not scientifically verified alternate dimensions, Akashic records, or supernatural access.",
    planes: PLANES
  };
}
