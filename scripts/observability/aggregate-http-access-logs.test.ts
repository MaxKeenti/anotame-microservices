import { describe, expect, test } from "bun:test";

import {
  aggregateHttpAccessLogs,
  type HttpAccessAggregate,
} from "./aggregate-http-access-logs";

function event(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    timestamp: "2026-07-23T01:00:00.000Z",
    event: "http_access",
    environment: "staging",
    service: "anotame-sales-service",
    deployment_id: "deployment-a",
    request_id: "00000000-0000-4000-8000-000000000001",
    method: "GET",
    route: "/orders/{orderId}",
    status: 200,
    duration_ms: 10,
    ...overrides,
  };
}

function jsonLines(records: unknown[]): string {
  return records.map((record) => JSON.stringify(record)).join("\n");
}

function onlyAggregate(records: unknown[]): HttpAccessAggregate {
  const aggregates = aggregateHttpAccessLogs(jsonLines(records), {
    commit: "abc123",
  });
  expect(aggregates).toHaveLength(1);
  return aggregates[0]!;
}

describe("aggregateHttpAccessLogs", () => {
  test("groups statuses and calculates nearest-rank percentiles deterministically", () => {
    const records = [
      event({ timestamp: "2026-07-23T01:00:04Z", duration_ms: 50, status: 500 }),
      event({ timestamp: "2026-07-23T01:00:01Z", duration_ms: 10, status: 200 }),
      event({ timestamp: "2026-07-23T01:00:02Z", duration_ms: 20, status: 201 }),
      event({ timestamp: "2026-07-23T01:00:03Z", duration_ms: 40, status: 404 }),
    ];

    const forward = onlyAggregate(records);
    const reverse = onlyAggregate([...records].reverse());

    expect(reverse).toEqual(forward);
    expect(forward).toEqual({
      environment: "staging",
      service: "anotame-sales-service",
      deployment: "deployment-a",
      commit: "abc123",
      method: "GET",
      route: "/orders/{orderId}",
      observation: {
        start: "2026-07-23T01:00:01.000Z",
        end: "2026-07-23T01:00:04.000Z",
      },
      requests: 4,
      status: {
        "2xx": 2,
        "3xx": 0,
        "4xx": 1,
        "5xx": 1,
        other: 0,
      },
      rates: {
        "4xx": 0.25,
        "5xx": 0.25,
      },
      duration_ms: {
        p50: 20,
        p95: 50,
        p99: 50,
        max: 50,
      },
    });
  });

  test("keeps deployments and commits in separate, stable groups", () => {
    const input = JSON.stringify([
      event({ deployment_id: "deployment-b", commit_sha: "commit-b" }),
      event({ deployment_id: "deployment-a" }),
    ]);

    const aggregates = aggregateHttpAccessLogs(input, {
      commit: "fallback-a",
      commitMap: { "deployment-a": "mapped-a" },
    });

    expect(aggregates.map(({ deployment, commit }) => ({ deployment, commit }))).toEqual([
      { deployment: "deployment-a", commit: "mapped-a" },
      { deployment: "deployment-b", commit: "commit-b" },
    ]);
  });

  test("reads Railway attributes and structured message compatibility shapes", () => {
    const records = [
      {
        timestamp: "2026-07-23T01:00:00Z",
        attributes: event(),
      },
      {
        timestamp: "2026-07-23T01:00:01Z",
        message: JSON.stringify(event({ timestamp: undefined })),
      },
      { timestamp: "2026-07-23T01:00:02Z", message: "ordinary log" },
    ];

    const aggregate = onlyAggregate(records);
    expect(aggregate.requests).toBe(2);
  });

  test("rejects query strings, malformed fields, and missing commit attribution", () => {
    expect(() =>
      aggregateHttpAccessLogs(jsonLines([event({ route: "/orders?customer=secret" })]), {
        commit: "abc123",
      }),
    ).toThrow("contains a query string");

    expect(() =>
      aggregateHttpAccessLogs(jsonLines([event({ duration_ms: -1 })]), {
        commit: "abc123",
      }),
    ).toThrow("must not be negative");

    expect(() => aggregateHttpAccessLogs(jsonLines([event()]))).toThrow(
      "has no commit metadata",
    );
  });

  test("emits no request IDs or raw customer fields", () => {
    const aggregate = onlyAggregate([
      event({
        request_id: "00000000-0000-4000-8000-000000000099",
        customer_name: "Synthetic Customer",
      }),
    ]);
    const serialized = JSON.stringify(aggregate);

    expect(serialized).not.toContain("request_id");
    expect(serialized).not.toContain("00000000-0000-4000-8000-000000000099");
    expect(serialized).not.toContain("customer");
    expect(serialized).not.toContain("Synthetic Customer");
  });
});
