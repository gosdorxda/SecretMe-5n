import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get username and name from query params
    const username = searchParams.get("username")
    const name = searchParams.get("name") || "User"
    const bio = searchParams.get("bio") || `Kirim pesan anonim ke ${name} melalui SecretMe`
    const avatarUrl = searchParams.get("avatarUrl") || null

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
        {/* Background elements - subtle circles similar to template-image-generator */}
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

        {/* Main card with shadow and border - similar to profile image template */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "70%",
            padding: "40px",
            backgroundColor: "white",
            borderRadius: "16px",
            border: "2px solid black",
            boxShadow: "4px 4px 0px 0px black",
          }}
        >
          {/* Avatar with glow effect */}
          <div
            style={{
              position: "relative",
              marginBottom: "24px",
            }}
          >
            {/* Glow effect */}
            <div
              style={{
                position: "absolute",
                width: "120px",
                height: "120px",
                borderRadius: "60px",
                background: "radial-gradient(circle, rgba(253, 151, 69, 0.5) 0%, rgba(253, 151, 69, 0) 70%)",
                top: "-10px",
                left: "-10px",
                zIndex: 0,
              }}
            />

            {/* Avatar circle */}
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#fd9745",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid black",
                position: "relative",
                zIndex: 1,
                overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl || "/placeholder.svg"}
                  alt={name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span style={{ fontSize: "40px", fontWeight: "bold", color: "white" }}>
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Name and username */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "32px", margin: "0 0 8px 0" }}>{name}</h1>
            <p style={{ fontSize: "18px", color: "#6b7280", margin: "0 0 16px 0" }}>@{username}</p>

            {/* Bio with max 2 lines */}
            {bio && (
              <p
                style={{
                  fontSize: "16px",
                  color: "#4b5563",
                  margin: "0 0 24px 0",
                  maxWidth: "400px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: "2",
                  WebkitBoxOrient: "vertical",
                }}
              >
                {bio}
              </p>
            )}
          </div>

          {/* CTA Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#fd9745",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: "bold",
              border: "2px solid black",
              boxShadow: "2px 2px 0px 0px black",
            }}
          >
            Kirimi Saya Pesan Anonim
          </div>
        </div>

        {/* SecretMe branding */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Dibuat dengan SecretMe - Kirim pesan anonim ke temanmu
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
