export default function ImmersiveBackground() {
  return (
    <>
      {/* Base cinematic workspace illustration */}
      <div
        className="fixed inset-0 z-[-3] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg_workspace.png')" }}
      />

      {/* Warm cinematic color grade overlay — orange/amber tones from lamps */}
      <div className="fixed inset-0 z-[-2] bg-gradient-to-br from-amber-900/20 via-transparent to-violet-900/30 pointer-events-none" />

      {/* Dark vignette to ensure text readability while keeping bg visible */}
      <div className="fixed inset-0 z-[-2] bg-gradient-to-b from-surface-950/70 via-surface-950/50 to-surface-950/80 pointer-events-none" />

      {/* Left sidebar dark panel to ensure sidebar readability */}
      <div className="fixed top-0 left-0 bottom-0 w-[280px] z-[-1] bg-gradient-to-r from-surface-950/90 via-surface-950/60 to-transparent pointer-events-none" />

      {/* Subtle warm ambient glow — top right (desk lamp / city glow) */}
      <div className="fixed top-0 right-0 w-[40%] h-[50%] bg-gradient-radial from-amber-600/12 to-transparent rounded-full blur-[100px] pointer-events-none z-[-1]" />

      {/* Subtle cool purple glow — bottom left */}
      <div className="fixed bottom-[-10%] left-[5%] w-[35%] h-[50%] bg-violet-700/15 rounded-full blur-[120px] pointer-events-none z-[-1]" />

      {/* Top center purple/indigo ambient from city skyline */}
      <div className="fixed top-[5%] left-[30%] w-[40%] h-[30%] bg-indigo-800/10 rounded-full blur-[80px] pointer-events-none z-[-1]" />
    </>
  )
}
