'use client';

import React, { useMemo } from 'react';

// Crisp SVGs for trending languages and frameworks
const ICONS = {
  python: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M11.914 2c-5.068 0-4.757 2.196-4.757 2.196l.006 2.274h4.829v.688H5.16s-3.16.358-3.16 4.675c0 4.318 2.76 4.195 2.76 4.195h1.646v-2.316s-.088-2.76 2.716-2.76h4.693s2.584.043 2.584-2.541V4.582S16.982 2 11.914 2zm-2.61 1.487a.89.89 0 110 1.78.89.89 0 010-1.78z"
        fill="#387EB8"
      />
      <path
        d="M12.086 22c5.068 0 4.757-2.196 4.757-2.196l-.006-2.274h-4.829v-.688h6.832s3.16-.358 3.16-4.675c0-4.318-2.76-4.195-2.76-4.195h-1.646v2.316s.088 2.76-2.716 2.76h-4.693s-2.584-.043-2.584 2.541v3.839S7.018 22 12.086 22zm2.61-1.487a.89.89 0 110-1.78.89.89 0 010 1.78z"
        fill="#FFE052"
      />
    </svg>
  ),
  react: (
    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="12" cy="12" rx="10" ry="4.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  ),
  typescript: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#3178C6" />
      <path d="M11.5 10H6.5v2.2h1.6v6.3h2.1v-6.3h1.3V10zm3.8 5.6c.4.3.9.5 1.5.5.6 0 1-.2 1-.6 0-.4-.4-.5-1.1-.8-.9-.4-1.8-.9-1.8-1.9 0-1.2 1-2 2.5-2 .8 0 1.5.2 2 .5l-.5 1.7c-.4-.3-.9-.4-1.5-.4-.6 0-.9.2-.9.5 0 .4.4.5 1.1.8 1 .4 1.8.9 1.8 1.9 0 1.3-1 2.1-2.6 2.1-.9 0-1.8-.3-2.3-.7l.3-1.7z" fill="white" />
    </svg>
  ),
  nextjs: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="11" fill="black" stroke="#475569" strokeWidth="1.2" />
      <path d="M7.5 7.5v9h2.25v-4.875L14.625 18H17.5V7.5h-2.25v4.875L10.375 7.5H7.5z" fill="white" />
    </svg>
  ),
  docker: (
    <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.186.186 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H2.208a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185M23.77 12.3c-.347-.238-.99-.347-1.748-.282a5.053 5.053 0 00-.635-1.722c-.105-.176-.237-.306-.381-.306-.058 0-.115.021-.167.062-.234.183-.347.608-.347 1.258 0 .347.037.712.112 1.077a7.618 7.618 0 00-1.895-.246c-2.454 0-4.664.912-6.19 2.418-1.526-1.506-3.736-2.418-6.19-2.418-.54 0-1.068.046-1.579.134C2.102 12.44 1 13.568 1 15.026c0 3.245 4.316 5.874 9.637 5.874 5.006 0 9.117-2.33 9.588-5.328 1.488-.14 2.87-.78 3.545-1.77.29-.427.272-1.074 0-1.502" />
    </svg>
  ),
  rust: (
    <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1.2 14.5h-2.4v-1.8h2.4zm2.1-4.2c-.3.4-.8.7-1.4.9v.1c.9.2 1.6.8 1.6 1.8 0 1.4-1.1 2.3-2.9 2.3H8.5V7.1h3.9c1.7 0 2.8.9 2.8 2.2 0 .9-.5 1.6-1.3 1.9l1.4 1.1zm-4.5-3.3h1.7c.7 0 1.2-.3 1.2-.9 0-.6-.5-.9-1.2-.9h-1.7zm0 2.5v2h1.9c.8 0 1.3-.4 1.3-1s-.5-1-1.3-1z" />
    </svg>
  ),
  nodejs: (
    <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l8.5 4.9v9.8L12 22.1l-8.5-4.9V7.4L12 2.5zm0 2.3L5.5 8.5v7l6.5 3.8 6.5-3.8v-7L12 4.8zm0 4.2c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z" />
    </svg>
  ),
  golang: (
    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 10.5C2 7.5 4.5 5 8 5c2.3 0 4.2 1.1 5.3 2.8L11.5 9c-.8-1.2-2.1-1.9-3.5-1.9-2.3 0-4 1.6-4 3.4s1.7 3.4 4 3.4c1.5 0 2.8-.7 3.6-2H8v-2.1h6v4.6C12.7 15.8 10.5 17 8 17c-3.5 0-6-2.5-6-6.5zm16 6.5c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-2.2c2.1 0 3.8-1.7 3.8-3.8s-1.7-3.8-3.8-3.8-3.8 1.7-3.8 3.8 1.7 3.8 3.8 3.8z" />
    </svg>
  ),
  pytorch: (
    <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.7 2.1c-.4.2-.6.7-.4 1.1l.6 1.4c.1.3.4.5.7.5.8 0 1.5.7 1.5 1.5 0 .6-.3 1.1-.8 1.3l-1.3.6c-.4.2-.6.7-.4 1.1.2.4.7.6 1.1.4l1.3-.6c1.3-.6 2.1-1.8 2.1-3.2 0-1.9-1.5-3.5-3.5-3.5-.3 0-.6.1-.9.4zM6.8 7.3C4.2 9.4 2.5 12.5 2.5 16c0 5.2 4.3 9.5 9.5 9.5s9.5-4.3 9.5-9.5c0-3.5-1.7-6.6-4.3-8.7l-1.3 1.3c2.2 1.8 3.6 4.5 3.6 7.4 0 4.1-3.4 7.5-7.5 7.5s-7.5-3.4-7.5-7.5c0-2.9 1.4-5.6 3.6-7.4L6.8 7.3z" />
    </svg>
  ),
  graphql: (
    <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2zm0 2.3L4.99 8v8L12 19.7 19.01 16V8L12 4.3zM12 7a2 2 0 110 4 2 2 0 010-4zm-4.5 6a2 2 0 110 4 2 2 0 010-4zm9 0a2 2 0 110 4 2 2 0 010-4z" />
    </svg>
  ),
  tailwind: (
    <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 6c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-1.8 3.5-1.5.8.2 1.3.8 1.9 1.4 1 1 2.2 2.1 4.6 2.1 2.7 0 4.3-1.3 5-4-1 1.3-2.2 1.8-3.5 1.5-.8-.2-1.3-.8-1.9-1.4C15.6 6.6 14.4 6 12 6zM5 12c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-1.8 3.5-1.5.8.2 1.3.8 1.9 1.4 1 1 2.2 2.1 4.6 2.1 2.7 0 4.3-1.3 5-4-1 1.3-2.2 1.8-3.5 1.5-.8-.2-1.3-.8-1.9-1.4C8.6 12.6 7.4 12 5 12z" />
    </svg>
  ),
  kubernetes: (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.2L3.8 6.9v9.4L12 21l8.2-4.7V6.9L12 2.2zm0 2.3l6.2 3.6v7.2L12 18.9l-6.2-3.6V8.1L12 4.5zM12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
};

interface TechBadgeProps {
  icon: React.ReactNode;
  name: string;
  angle: number; // degrees
  radius: number; // px
  counterClass: string;
  isDashboard?: boolean;
}

function TechBadge({ icon, name, angle, radius, counterClass, isDashboard }: TechBadgeProps) {
  // Convert polar coordinates to Cartesian offset from center
  const rad = (angle * Math.PI) / 180;
  const x = Math.round(Math.cos(rad) * radius);
  const y = Math.round(Math.sin(rad) * radius);

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      }}
    >
      <div
        className={`${counterClass} flex items-center gap-1.5 bg-slate-900/70 hover:bg-slate-900 border border-slate-700/60 hover:border-indigo-500/60 rounded-full py-1 px-2.5 shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-700 ease-out cursor-default group ${
          isDashboard ? 'opacity-0 -translate-x-24 scale-75 pointer-events-none' : 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
        }`}
      >
        <div className="flex items-center justify-center">{icon}</div>
        <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white tracking-tight hidden sm:inline-block">
          {name}
        </span>
      </div>
    </div>
  );
}

interface OrbitBackgroundProps {
  isDashboard?: boolean;
}

export default function OrbitBackground({ isDashboard = false }: OrbitBackgroundProps) {
  // Generate random twinkling stars once
  const stars = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: (i * 37 + 13) % 100, // deterministic pseudo-random spread
      y: (i * 59 + 29) % 100,
      size: (i % 3) + 1.2, // 1.2px - 3.2px
      delay: (i * 0.4) % 4,
      duration: 3 + ((i * 0.7) % 3),
      opacity: 0.3 + ((i % 5) * 0.12),
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Twinkling Stars — always stay visible */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
            }}
          />
        ))}
      </div>

      {/* Center Orbiting System */}
      <div className="absolute top-[46%] sm:top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 flex items-center justify-center">
        
        {/* INNER ORBIT RING (Radius 270px) */}
        <div
          className={`absolute w-[540px] h-[540px] rounded-full border border-indigo-500/15 border-dashed animate-orbit-slow transition-opacity duration-700 ${
            isDashboard ? 'opacity-10' : 'opacity-100'
          }`}
        >
          <TechBadge icon={ICONS.python} name="Python" angle={30} radius={270} counterClass="animate-counter-slow" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.react} name="React" angle={150} radius={270} counterClass="animate-counter-slow" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.typescript} name="TypeScript" angle={270} radius={270} counterClass="animate-counter-slow" isDashboard={isDashboard} />
        </div>

        {/* MIDDLE ORBIT RING (Radius 420px) */}
        <div
          className={`absolute w-[840px] h-[840px] rounded-full border border-slate-700/25 animate-orbit-medium transition-opacity duration-700 ${
            isDashboard ? 'opacity-10' : 'opacity-100'
          }`}
        >
          <TechBadge icon={ICONS.nextjs} name="Next.js" angle={60} radius={420} counterClass="animate-counter-medium" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.docker} name="Docker" angle={160} radius={420} counterClass="animate-counter-medium" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.rust} name="Rust" angle={250} radius={420} counterClass="animate-counter-medium" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.nodejs} name="Node.js" angle={330} radius={420} counterClass="animate-counter-medium" isDashboard={isDashboard} />
        </div>

        {/* OUTER ORBIT RING (Radius 580px) */}
        <div
          className={`absolute w-[1160px] h-[1160px] rounded-full border border-slate-800/30 border-dashed animate-orbit-fast transition-opacity duration-700 ${
            isDashboard ? 'opacity-10' : 'opacity-100'
          }`}
        >
          <TechBadge icon={ICONS.pytorch} name="PyTorch" angle={15} radius={580} counterClass="animate-counter-fast" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.golang} name="Go" angle={105} radius={580} counterClass="animate-counter-fast" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.kubernetes} name="Kubernetes" angle={195} radius={580} counterClass="animate-counter-fast" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.tailwind} name="Tailwind" angle={285} radius={580} counterClass="animate-counter-fast" isDashboard={isDashboard} />
          <TechBadge icon={ICONS.graphql} name="GraphQL" angle={345} radius={580} counterClass="animate-counter-fast" isDashboard={isDashboard} />
        </div>

      </div>
    </div>
  );
}
