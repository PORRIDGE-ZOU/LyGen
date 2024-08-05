import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { track, artist, enhanced } = await req.json();

    const flaskRes = await fetch("http://127.0.0.1:5000/search-lyrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ track, artist, enhanced }),
    });

    if (!flaskRes.ok) {
      throw new Error("Failed to fetch lyrics from Flask backend");
    }

    const data = await flaskRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return NextResponse.json(
      { error: "Failed to search lyrics" },
      { status: 500 }
    );
  }
}
