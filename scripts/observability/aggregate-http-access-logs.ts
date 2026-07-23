#!/usr/bin/env bun

import { readFile } from "node:fs/promises";

type JsonRecord = Record<string, unknown>;

export interface AggregateOptions {
  commit?: string;
  commitMap?: Record<string, string>;
}

export interface HttpAccessAggregate {
  environment: string;
  service: string;
  deployment: string;
  commit: string;
  method: string;
  route: string;
  observation: {
    start: string;
    end: string;
  };
  requests: number;
  status: {
    "2xx": number;
    "3xx": number;
    "4xx": number;
    "5xx": number;
    other: number;
  };
  rates: {
    "4xx": number;
    "5xx": number;
  };
  duration_ms: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
}

interface ParsedAccessEvent {
  environment: string;
  service: string;
  deployment: string;
  commit: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

interface MutableGroup {
  identity: Omit<ParsedAccessEvent, "status" | "durationMs" | "timestamp">;
  timestamps: string[];
  statuses: number[];
  durations: number[];
}

interface CliOptions extends AggregateOptions {
  input?: string;
  commitMapPath?: string;
}

const COMMIT_FIELDS = ["commit", "commit_sha", "git_commit_sha"] as const;
const SAFE_COMMIT = /^[0-9a-zA-Z._/-]{1,128}$/;

function usage(): string {
  return `Usage:
  bun scripts/observability/aggregate-http-access-logs.ts [options] [file]

Reads bounded Railway JSON-log exports from a file or stdin and writes stable
JSON aggregates to stdout. Non-http_access records are ignored.

Options:
  --commit <sha>       Fallback commit for events without commit metadata
  --commit-map <file>  JSON object mapping deployment IDs to commits
  -h, --help           Show this help

Examples:
  railway logs ... --json | bun scripts/observability/aggregate-http-access-logs.ts --commit 0123abcd
  bun scripts/observability/aggregate-http-access-logs.ts --commit-map deployments.json export.jsonl`;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonBlankString(record: JsonRecord, field: string): string {
  const value = record[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`http_access field "${field}" must be a non-empty string`);
  }
  return value;
}

function finiteInteger(record: JsonRecord, field: string): number {
  const value = record[field];
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) {
    throw new Error(`http_access field "${field}" must be an integer`);
  }
  return number;
}

function normalizeTimestamp(value: string): string {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) {
    throw new Error('http_access field "timestamp" must be an ISO-8601 timestamp');
  }
  return new Date(milliseconds).toISOString();
}

function resolveRecord(value: unknown): JsonRecord | undefined {
  if (!isRecord(value)) {
    throw new Error("each Railway log record must be a JSON object");
  }
  if (value.event === "http_access") {
    return value;
  }
  if (isRecord(value.attributes) && value.attributes.event === "http_access") {
    return { ...value, ...value.attributes };
  }
  if (typeof value.message === "string" && value.message.trim().startsWith("{")) {
    try {
      const message = JSON.parse(value.message);
      if (isRecord(message) && message.event === "http_access") {
        return { ...value, ...message };
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function resolveCommit(
  record: JsonRecord,
  deployment: string,
  options: AggregateOptions,
): string {
  let commit: string | undefined;
  for (const field of COMMIT_FIELDS) {
    if (typeof record[field] === "string" && record[field].trim() !== "") {
      commit = record[field].trim();
      break;
    }
  }
  commit ??= options.commitMap?.[deployment];
  commit ??= options.commit;
  if (!commit) {
    throw new Error(
      `deployment "${deployment}" has no commit metadata; pass --commit or --commit-map`,
    );
  }
  if (!SAFE_COMMIT.test(commit)) {
    throw new Error(`commit for deployment "${deployment}" has an unsafe value`);
  }
  return commit;
}

function parseAccessEvent(
  value: unknown,
  options: AggregateOptions,
): ParsedAccessEvent | undefined {
  const record = resolveRecord(value);
  if (!record) {
    return undefined;
  }

  const deployment = nonBlankString(record, "deployment_id");
  const route = nonBlankString(record, "route");
  if (route.includes("?")) {
    throw new Error(`route for deployment "${deployment}" contains a query string`);
  }

  const status = finiteInteger(record, "status");
  if (status < 100 || status > 599) {
    throw new Error(`status for deployment "${deployment}" must be between 100 and 599`);
  }

  const durationMs = finiteInteger(record, "duration_ms");
  if (durationMs < 0) {
    throw new Error(`duration_ms for deployment "${deployment}" must not be negative`);
  }

  return {
    environment: nonBlankString(record, "environment"),
    service: nonBlankString(record, "service"),
    deployment,
    commit: resolveCommit(record, deployment, options),
    method: nonBlankString(record, "method").toUpperCase(),
    route,
    status,
    durationMs,
    timestamp: normalizeTimestamp(nonBlankString(record, "timestamp")),
  };
}

function parseJsonRecords(input: string): unknown[] {
  const trimmed = input.trim();
  if (trimmed === "") {
    return [];
  }

  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON input beginning with '[' must be an array");
    }
    return parsed;
  }

  return trimmed.split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`invalid JSON on input line ${index + 1}: ${reason}`);
    }
  });
}

function percentile(sortedValues: number[], fraction: number): number {
  const index = Math.max(0, Math.ceil(sortedValues.length * fraction) - 1);
  return sortedValues[index]!;
}

function rate(count: number, total: number): number {
  return Number((count / total).toFixed(6));
}

function groupKey(event: ParsedAccessEvent): string {
  return [
    event.environment,
    event.service,
    event.deployment,
    event.commit,
    event.method,
    event.route,
  ].join("\u0000");
}

export function aggregateHttpAccessLogs(
  input: string,
  options: AggregateOptions = {},
): HttpAccessAggregate[] {
  const groups = new Map<string, MutableGroup>();

  for (const value of parseJsonRecords(input)) {
    const event = parseAccessEvent(value, options);
    if (!event) {
      continue;
    }

    const key = groupKey(event);
    let group = groups.get(key);
    if (!group) {
      group = {
        identity: {
          environment: event.environment,
          service: event.service,
          deployment: event.deployment,
          commit: event.commit,
          method: event.method,
          route: event.route,
        },
        timestamps: [],
        statuses: [],
        durations: [],
      };
      groups.set(key, group);
    }
    group.timestamps.push(event.timestamp);
    group.statuses.push(event.status);
    group.durations.push(event.durationMs);
  }

  return [...groups.values()]
    .sort((left, right) => groupKey({
      ...left.identity,
      status: 0,
      durationMs: 0,
      timestamp: "",
    }).localeCompare(groupKey({
      ...right.identity,
      status: 0,
      durationMs: 0,
      timestamp: "",
    })))
    .map((group) => {
      const timestamps = [...group.timestamps].sort();
      const durations = [...group.durations].sort((left, right) => left - right);
      const counts = {
        "2xx": group.statuses.filter((status) => status >= 200 && status < 300).length,
        "3xx": group.statuses.filter((status) => status >= 300 && status < 400).length,
        "4xx": group.statuses.filter((status) => status >= 400 && status < 500).length,
        "5xx": group.statuses.filter((status) => status >= 500 && status < 600).length,
        other: group.statuses.filter((status) => status < 200 || status >= 600).length,
      };
      const requests = group.statuses.length;

      return {
        ...group.identity,
        observation: {
          start: timestamps[0]!,
          end: timestamps[timestamps.length - 1]!,
        },
        requests,
        status: counts,
        rates: {
          "4xx": rate(counts["4xx"], requests),
          "5xx": rate(counts["5xx"], requests),
        },
        duration_ms: {
          p50: percentile(durations, 0.5),
          p95: percentile(durations, 0.95),
          p99: percentile(durations, 0.99),
          max: durations[durations.length - 1]!,
        },
      };
    });
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]!;
    if (argument === "-h" || argument === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    if (argument === "--commit" || argument === "--commit-map") {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`${argument} requires a value`);
      }
      if (argument === "--commit") {
        options.commit = value;
      } else {
        options.commitMapPath = value;
      }
      index += 1;
      continue;
    }
    if (argument.startsWith("-")) {
      throw new Error(`unknown option: ${argument}`);
    }
    if (options.input) {
      throw new Error("only one input file may be provided");
    }
    options.input = argument;
  }

  return options;
}

async function readCommitMap(path: string): Promise<Record<string, string>> {
  const value = JSON.parse(await readFile(path, "utf8"));
  if (!isRecord(value) || Object.values(value).some((commit) => typeof commit !== "string")) {
    throw new Error("--commit-map must contain a JSON object of deployment-to-commit strings");
  }
  return value as Record<string, string>;
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.commitMapPath) {
    options.commitMap = await readCommitMap(options.commitMapPath);
  }

  const input = options.input
    ? await readFile(options.input, "utf8")
    : await Bun.stdin.text();
  const aggregates = aggregateHttpAccessLogs(input, options);
  process.stdout.write(`${JSON.stringify({ schema_version: 1, aggregates }, null, 2)}\n`);
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    process.stderr.write(`aggregate-http-access-logs: ${reason}\n`);
    process.exit(1);
  }
}
