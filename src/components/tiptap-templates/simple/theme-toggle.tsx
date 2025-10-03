import * as React from "react"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon"
import { SunIcon } from "@/components/tiptap-icons/sun-icon"
import { useTheme } from "@/hooks/use-theme"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const toggleDarkMode = () => setTheme(theme === "light" ? "dark" : "light")

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      data-style="ghost"
    >
      {theme === "light" ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  )
}
