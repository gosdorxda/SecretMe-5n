import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get username and name from query params
    const username = searchParams.get("username")
    const name = searchParams.get("name") || "User"

    if (!username) {
      return new Response("Missing username parameter", { status: 400 })
    }

    // Load font
    const interSemiBold = await fetch(new URL("../../assets/Inter-SemiBold.ttf", import.meta.url)).then((res) =>
      res.arrayBuffer(),
    )

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff4e0",
          position: "relative",
          fontFamily: "Inter",
        }}
      >
        {/* Background elements */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            borderRadius: "100%",
            background: "rgba(253, 151, 69, 0.2)",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "150px",
            height: "150px",
            borderRadius: "100%",
            background: "rgba(253, 151, 69, 0.15)",
          }}
        />

        {/* Logo and branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#fd9745",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "12px",
              border: "2px solid black",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: "24px", fontWeight: "bold" }}>
            Secret<span style={{ color: "#fd9745" }}>Me</span>
          </span>
        </div>

        {/* Profile info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "white",
            borderRadius: "16px",
            border: "2px solid black",
            boxShadow: "4px 4px 0px 0px black",
            width: "80%",
            maxWidth: "500px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              border: "2px solid black",
            }}
          >
            <span style={{ fontSize: "32px", fontWeight: "bold" }}>{name.charAt(0).toUpperCase()}</span>
          </div>

          <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>{name}</h1>
          <p style={{ fontSize: "18px", color: "#4b5563", margin: "0 0 16px 0" }}>@{username}</p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fd9745",
              color: "black",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "bold",
              border: "2px solid black",
            }}
          >
            Kirim Pesan Anonim
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: interSemiBold,
            style: "normal",
            weight: 600,
          },
        ],
      },
    )
  } catch (e: any) {
    console.error(`Error generating OG image: ${e.message}`)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}
