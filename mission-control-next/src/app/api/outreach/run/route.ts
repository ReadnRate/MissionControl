import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync(
      "python3 /data/.openclaw/workspace/scripts/outreach_sender.py 2>&1",
      { timeout: 120_000 }
    );
    return NextResponse.json({ success: true, output: stdout, error: stderr || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, output: err.stdout || "", error: err.message });
  }
}
