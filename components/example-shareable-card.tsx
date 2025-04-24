"use client"

import { ShareableCard } from "@/components/shareable-card"
import { CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ExampleShareableCard() {
  return (
    <ShareableCard
      className="w-full max-w-md mx-auto"
      title="My Profile Card"
      shareText="Check out my profile on SecretMe!"
    >
      <CardHeader>
        <CardTitle>John Doe</CardTitle>
        <CardDescription>Web Developer</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          This is an example of a shareable card. Click the share button in the top right corner to generate and share
          an image of this card.
        </p>
      </CardContent>
      <CardFooter>
        <Button>View Profile</Button>
      </CardFooter>
    </ShareableCard>
  )
}
