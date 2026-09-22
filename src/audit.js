import { load, save, id } from "./store.js";

export function audit(type, payload = {}) {
  const events = load("audit_events", []);
  const event = {
    id: id("aud"),
    type,
    payload,
    createdAt: new Date().toISOString()
  };
  events.push(event);
  save("audit_events", events);
  return event;
}

export function listAudit() {
  return load("audit_events", []);
}
