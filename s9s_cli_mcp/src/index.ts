import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { runS9sRaw, runS9s } from "./runner.js";

function extractJson(text: string): unknown | null {
  const input = text.trim();
  try {
    return JSON.parse(input);
  } catch {}
  const firstCurly = input.indexOf("{");
  const lastCurly = input.lastIndexOf("}");
  if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
    const slice = input.slice(firstCurly, lastCurly + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }
  const firstBracket = input.indexOf("[");
  const lastBracket = input.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const slice = input.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }
  return null;
}

const server = new McpServer({
  name: "s9s-cli-mcp",
  version: "0.1.0",
});

server.registerTool(
  "s9s_version",
  {
    title: "s9s version",
    description: "Return `s9s --version` output",
    inputSchema: {},
  },
  async () => {
    const result = await runS9sRaw(["--version"]);
    return {
      content: [
        { type: "text", text: result.stdout || result.stderr || "" },
      ],
      isError: result.exitCode !== 0,
    };
  }
);

server.registerTool(
  "s9s_help",
  {
    title: "s9s help",
    description: "Return `s9s --help` output",
    inputSchema: {},
  },
  async () => {
    const result = await runS9sRaw(["--help"]);
    return {
      content: [
        { type: "text", text: result.stdout || result.stderr || "" },
      ],
      isError: result.exitCode !== 0,
    };
  }
);

server.registerTool(
  "cluster_list",
  {
    title: "List clusters",
    description: "Run `s9s cluster --list` with optional flags",
    inputSchema: {
      flags: z.array(z.string()).optional(),
    },
  },
  async ({ flags }: { flags?: string[] }) => {
    const args = ["cluster", "--list", "--print-json", ...(flags ?? [])];
    const result = await runS9sRaw(args);
    if (result.exitCode !== 0) {
      return {
        content: [{ type: "text", text: result.stderr || result.stdout }],
        isError: true,
      };
    }
    const parsed = extractJson(result.stdout || result.stderr || "");
    const text = parsed ? JSON.stringify(parsed, null, 2) : (result.stdout || result.stderr || "");
    return {
      content: [{ type: "text", text }],
      isError: false,
    };
  }
);

server.registerTool(
  "job_list",
  {
    title: "List jobs",
    description: "Run `s9s job --list` with optional flags",
    inputSchema: {
      flags: z.array(z.string()).optional(),
    },
  },
  async ({ flags }: { flags?: string[] }) => {
    const args = ["job", "--list", ...(flags ?? [])];
    const result = await runS9sRaw(args);
    return {
      content: [
        { type: "text", text: result.stdout || result.stderr || "" },
      ],
      isError: result.exitCode !== 0,
    };
  }
);

server.registerTool(
  "node_list",
  {
    title: "List nodes",
    description: "Run `s9s node --list --print-json` with optional flags",
    inputSchema: {
      flags: z.array(z.string()).optional(),
    },
  },
  async ({ flags }: { flags?: string[] }) => {
    const args = ["node", "--list", "--print-json", ...(flags ?? [])];
    const result = await runS9sRaw(args);
    if (result.exitCode !== 0) {
      return {
        content: [{ type: "text", text: result.stderr || result.stdout }],
        isError: true,
      };
    }
    const parsed = extractJson(result.stdout || result.stderr || "");
    const text = parsed ? JSON.stringify(parsed, null, 2) : (result.stdout || result.stderr || "");
    return {
      content: [{ type: "text", text }],
      isError: false,
    };
  }
);

server.registerTool(
  "backup_list",
  {
    title: "List backups",
    description: "Run `s9s backup --list --print-json` with optional flags",
    inputSchema: {
      flags: z.array(z.string()).optional(),
    },
  },
  async ({ flags }: { flags?: string[] }) => {
    const args = ["backup", "--list", "--print-json", ...(flags ?? [])];
    const result = await runS9sRaw(args);
    if (result.exitCode !== 0) {
      return {
        content: [{ type: "text", text: result.stderr || result.stdout }],
        isError: true,
      };
    }
    const parsed = extractJson(result.stdout || result.stderr || "");
    const text = parsed ? JSON.stringify(parsed, null, 2) : (result.stdout || result.stderr || "");
    return {
      content: [{ type: "text", text }],
      isError: false,
    };
  }
);

server.registerTool(
  "cluster_list_config",
  {
    title: "List cluster configuration",
    description: "Run `s9s cluster --cluster-id=X --list-config` to get cluster configuration",
    inputSchema: {
      clusterId: z.union([z.string(), z.number()]).transform(String),
      flags: z.array(z.string()).optional(),
    },
  },
  async ({ clusterId, flags }: { clusterId: string; flags?: string[] }) => {
    const args = ["cluster", `--cluster-id=${clusterId}`, "--list-config", ...(flags ?? [])];
    const result = await runS9sRaw(args);
    return {
      content: [
        { type: "text", text: result.stdout || result.stderr || "" },
      ],
      isError: result.exitCode !== 0,
    };
  }
);

server.registerTool(
  "job_log",
  {
    title: "Get job log",
    description: "Get logs for a specific job using job ID",
    inputSchema: {
      jobId: z.union([z.string(), z.number()]).transform(String),
    },
  },
  async ({ jobId }: { jobId: string }) => {
    const args = ["job", "--log", `--job-id=${jobId}`];
    const result = await runS9sRaw(args);
    return {
      content: [
        { type: "text", text: result.stdout || result.stderr || "" },
      ],
      isError: result.exitCode !== 0,
    };
  }
);

server.registerTool(
  "s9s_exec",
  {
    title: "Execute s9s subcommand",
    description:
      "Execute a whitelisted s9s subcommand with args. Returns stdout/stderr/exitCode",
    inputSchema: {
      subcommand: z
        .string()
        .refine((v: string) => ["cluster", "job", "task", "server", "node", "backup"].includes(v), {
          message: "subcommand must be one of: cluster, job, task, server, node, backup",
        }),
      args: z.array(z.string()).optional(),
      timeoutSeconds: z.number().int().positive().optional(),
    },
  },
  async ({
    subcommand,
    args,
    timeoutSeconds,
  }: {
    subcommand: string;
    args?: string[];
    timeoutSeconds?: number;
  }) => {
    const result = await runS9s(subcommand, args ?? [], timeoutSeconds);
    const payload = JSON.stringify(result, null, 2);
    return {
      content: [{ type: "text", text: payload }],
      isError: result.exitCode !== 0,
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
