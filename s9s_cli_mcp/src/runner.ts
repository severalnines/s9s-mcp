import dotenv from "dotenv";
import { execa } from "execa";

// Load environment variables from .env if it exists
dotenv.config();

export type ExecOptions = {
  args?: string[];
  timeoutSeconds?: number;
};

export type ExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

const DEFAULT_TIMEOUT_MS = 60_000; // 60 seconds

export const getS9sEnv = () => {
  const env: Record<string, string> = {};
  const keys = [
    "S9S_HOME",
    "CC_HOST",
    "CC_USER",
    "CC_PASS",
    "CC_KEYFILE",
    "CC_PORT",
  ];
  for (const k of keys) {
    const v = process.env[k];
    if (v) env[k] = v;
  }
  return env;
};

export const s9sBin = () => process.env.S9S_BIN || "s9s";

export async function runS9sRaw(cmdArgs: string[], timeoutSeconds?: number): Promise<ExecResult> {
  const timeout = (timeoutSeconds ?? DEFAULT_TIMEOUT_MS / 1000) * 1000;
  
  // Commands that don't accept connection arguments
  const standaloneCommands = ["--version", "--help"];
  const isStandaloneCommand = cmdArgs.length > 0 && standaloneCommands.includes(cmdArgs[0]);
  
  let finalArgs: string[];
  
  if (isStandaloneCommand) {
    // For standalone commands, use only the provided arguments
    finalArgs = [...cmdArgs];
  } else {
    // Build connection args from environment if available
    const connectionArgs: string[] = [];
    const env = getS9sEnv();
    
    if (env.CC_HOST) {
      connectionArgs.push(`--controller=${env.CC_HOST}`);
    }
    if (env.CC_PORT) {
      connectionArgs.push(`--controller-port=${env.CC_PORT}`);
    }
    if (env.CC_USER) {
      connectionArgs.push(`--cmon-user=${env.CC_USER}`);
    }
    if (env.CC_PASS) {
      connectionArgs.push(`--password=${env.CC_PASS}`);
    }
    if (env.CC_KEYFILE) {
      connectionArgs.push(`--private-key-file=${env.CC_KEYFILE}`);
    }
    
    // Combine: connection args + user args + --rpc-tls
    finalArgs = [...connectionArgs, ...cmdArgs, "--rpc-tls"];
  }
  
  try {
    const subprocess = execa(s9sBin(), finalArgs, {
      env: {
        ...process.env,
        ...getS9sEnv(),
      },
      timeout,
    });
    const { stdout, stderr, exitCode } = await subprocess;
    return { stdout, stderr, exitCode: exitCode ?? 0 };
  } catch (err: unknown) {
    // execa throws on non-zero exit; capture stdout/stderr
    const e = err as any;
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? String(e.message ?? e),
      exitCode: e.exitCode ?? 1,
    };
  }
}

export async function runS9s(subcommand: string, args: string[] = [], timeoutSeconds?: number) {
  return runS9sRaw([subcommand, ...args], timeoutSeconds);
}
