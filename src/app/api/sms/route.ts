import { NextResponse } from "next/server";

/** Twilio wiring example — set TWILIO_* env vars on Vercel to enable. */
export async function POST(req: Request) {
  const body = (await req.json()) as { to?: string; text?: string };
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from || !body.to || !body.text) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "SMS disabled: configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, and POST { to, text }.",
      },
      { status: 501 },
    );
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ From: from, To: body.to, Body: body.text });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: data }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sid: data.sid });
}
