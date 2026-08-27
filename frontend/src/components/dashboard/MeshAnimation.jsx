// MeshAnimation: full-screen animated mesh gradient background with four blobs for the landing page.
import React from 'react';

const MeshGradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 h-screen w-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950 pointer-events-none">
      <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute inset-0 opacity-70 mix-blend-screen blur-3xl">
        <div className="absolute -left-[10%] top-[10%] h-[40vw] w-[40vw] min-h-[300px] min-w-[300px] max-h-[800px] max-w-[800px] animate-blob-slow rounded-full bg-gradient-to-br from-blue-600/60 via-cyan-500/50 to-transparent" />
        <div className="absolute right-[-5%] top-[30%] h-[50vw] w-[50vw] min-h-[350px] min-w-[350px] max-h-[1000px] max-w-[1000px] animate-blob-medium rounded-full bg-gradient-to-tl from-purple-600/70 via-pink-500/50 to-transparent animation-delay-4000" />
        <div className="absolute left-[15%] bottom-[5%] h-[35vw] w-[35vw] min-h-[280px] min-w-[280px] max-h-[700px] max-w-[700px] animate-blob-slow rounded-full bg-gradient-to-tr from-pink-600/60 via-rose-500/40 to-transparent animation-delay-8000" />
        <div className="absolute right-[10%] bottom-[20%] h-[45vw] w-[45vw] min-h-[320px] min-w-[320px] max-h-[900px] max-w-[900px] animate-blob-medium rounded-full bg-gradient-to-bl from-teal-500/50 via-emerald-600/40 to-transparent animation-delay-12000" />
      </div>
    </div>
  );
};

export default MeshGradientBackground;