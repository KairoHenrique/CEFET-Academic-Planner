import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  mergeRecentPanelArchive,
  RECENT_PANEL_TTL_MS,
} from "../src/lib/notifications/notification-recent-panel";
import type { NotificationSnapshotItem } from "../src/lib/types/notifications-api";

const item: NotificationSnapshotItem = {
  fingerprint: "calendar-event-reminder:1|2026-03-02|new",
  kind: "calendar-event-reminder",
  title: "Novo evento",
  subtitle: "Cadastrado: X · Calendário",
  href: "/calendario",
  at: "2026-03-02",
};

describe("mergeRecentPanelArchive", () => {
  test("rearquivar o mesmo fingerprint preserva seenAt", () => {
    const t0 = "2026-03-01T10:00:00.000Z";
    const t1 = "2026-03-01T20:00:00.000Z";

    const first = mergeRecentPanelArchive([], [item], t0);
    const second = mergeRecentPanelArchive(first, [item], t1);

    assert.equal(second.length, 1);
    assert.equal(second[0]?.seenAt, t0);
  });

  test("expira após 24h do seenAt original", () => {
    const t0 = "2026-03-01T10:00:00.000Z";
    const archived = mergeRecentPanelArchive([], [item], t0);
    const afterTtl =
      Date.parse(t0) + RECENT_PANEL_TTL_MS + 1_000;

    const pruned = mergeRecentPanelArchive(
      archived,
      [],
      new Date(afterTtl).toISOString(),
      afterTtl
    );

    assert.equal(pruned.length, 0);
  });
});
