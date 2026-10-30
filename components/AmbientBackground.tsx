export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950"
    >
      {/* Luminous aurora blobs. `mix-blend-screen` keeps them glowing against
          the near-black base (multiply would render them invisible). */}
      <div className="absolute -top-56 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 animate-pulse-soft rounded-full bg-indigo-600/30 blur-[128px] mix-blend-screen motion-reduce:animate-none" />
      <div className="animation-delay-2000 absolute -left-40 top-1/4 h-[32rem] w-[32rem] animate-drift rounded-full bg-violet-600/25 blur-[128px] mix-blend-screen motion-reduce:animate-none" />
      <div className="animation-delay-4000 absolute -right-40 top-1/2 h-[30rem] w-[30rem] animate-drift-slow rounded-full bg-cyan-500/15 blur-[128px] mix-blend-screen motion-reduce:animate-none" />
      <div className="absolute -bottom-40 left-1/3 h-[26rem] w-[26rem] animate-float rounded-full bg-fuchsia-600/15 blur-[128px] mix-blend-screen motion-reduce:animate-none" />

      {/* Fine technical grid, faded out from the top. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:72px_72px] [mask-image:radial-gradient(ellipse_at_50%_0%,black_8%,transparent_72%)]" />

      {/* Vignette to sink the edges into the dark. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(5,4,15,0.9)_100%)]" />
    </div>
  );
}
