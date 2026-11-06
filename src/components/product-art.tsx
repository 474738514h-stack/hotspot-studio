import type { LucideIcon } from "lucide-react"
import {
  BackpackIcon,
  CoffeeIcon,
  Gamepad2Icon,
  GaugeIcon,
  GlassWaterIcon,
  HeadphonesIcon,
  KeyboardIcon,
  LampIcon,
  LuggageIcon,
  PenLineIcon,
  PlugZapIcon,
  ShirtIcon,
  SpeakerIcon,
  SparklesIcon,
  FootprintsIcon,
  LayersIcon,
} from "lucide-react"
import { cn } from "cn"

const ART: Record<string, { icon: LucideIcon; from: string; to: string; ink: string }> = {
  "pen-set": { icon: PenLineIcon, from: "#efe7ff", to: "#d9c8ff", ink: "#5b3fd6" },
  backpack: { icon: BackpackIcon, from: "#e7f0ff", to: "#c9dbff", ink: "#2451b8" },
  lamp: { icon: LampIcon, from: "#fff4d8", to: "#ffe1a3", ink: "#b86a00" },
  gamepad: { icon: Gamepad2Icon, from: "#ece7ff", to: "#d4c6ff", ink: "#5a33d6" },
  keyboard: { icon: KeyboardIcon, from: "#e8eefc", to: "#d5def6", ink: "#33406a" },
  headset: { icon: HeadphonesIcon, from: "#e5f7f2", to: "#c6eee2", ink: "#0f766e" },
  shoes: { icon: FootprintsIcon, from: "#fff0e8", to: "#ffd7c2", ink: "#c2410c" },
  socks: { icon: LayersIcon, from: "#eef2ff", to: "#dbe3ff", ink: "#3730a3" },
  bottle: { icon: GlassWaterIcon, from: "#e5f6ff", to: "#c9ecff", ink: "#0369a1" },
  mask: { icon: SparklesIcon, from: "#fde8f3", to: "#fbcfe8", ink: "#be185d" },
  charger: { icon: PlugZapIcon, from: "#e9fbe9", to: "#c9f2c4", ink: "#15803d" },
  gauge: { icon: GaugeIcon, from: "#eef2f6", to: "#d7e0ea", ink: "#334155" },
  cubes: { icon: LuggageIcon, from: "#fff6e8", to: "#ffe2b8", ink: "#b45309" },
  hoodie: { icon: ShirtIcon, from: "#f3e8ff", to: "#e4d4ff", ink: "#6d28d9" },
  coffee: { icon: CoffeeIcon, from: "#f8eee6", to: "#edd2bc", ink: "#7c3f12" },
  speaker: { icon: SpeakerIcon, from: "#e8fbff", to: "#c8f3fb", ink: "#0e7490" },
}

export function ProductArt({ id, className }: { id: string; className?: string }) {
  const art = ART[id] ?? { icon: SparklesIcon, from: "#f3f0ff", to: "#e4dcff", ink: "#6d4aff" }
  const Icon = art.icon
  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden", className)}
      style={{ background: `linear-gradient(160deg, ${art.from}, ${art.to})` }}
    >
      <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/40" />
      <div className="absolute -bottom-8 -left-6 size-20 rounded-full bg-white/30" />
      <div className="relative grid size-16 place-items-center rounded-2xl bg-white/80 shadow-sm">
        <Icon className="size-8" style={{ color: art.ink }} strokeWidth={1.6} />
      </div>
    </div>
  )
}
