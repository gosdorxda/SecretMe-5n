"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"
import { Footer } from "./footer"

type FooterContextType = {
  hideGlobalFooter: () => void
  showGlobalFooter: () => void
  isGlobalFooterHidden: boolean
}

const FooterContext = createContext<FooterContextType>({
  hideGlobalFooter: () => {},
  showGlobalFooter: () => {},
  isGlobalFooterHidden: false,
})

export function useFooter() {
  return useContext(FooterContext)
}

export function FooterProvider({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(false)

  const hideGlobalFooter = () => setIsHidden(true)
  const showGlobalFooter = () => setIsHidden(false)

  return (
    <FooterContext.Provider
      value={{
        hideGlobalFooter,
        showGlobalFooter,
        isGlobalFooterHidden: isHidden,
      }}
    >
      {children}
      {!isHidden && <Footer />}
    </FooterContext.Provider>
  )
}
