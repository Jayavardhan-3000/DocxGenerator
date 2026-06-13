import { NextRequest, NextResponse } from "next/server";
import { analyzeScript } from "@/lib/scriptPatcher";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }
    const analysis = analyzeScript(code);
    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
