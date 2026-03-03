import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

const ZeroCutoutVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;

    try {
      context = canvas.getContext("2d", {
        willReadFrequently: true,
      });
    } catch {
      return;
    }

    if (!context) {
      return;
    }

    let frameId = 0;

    const renderFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        frameId = window.requestAnimationFrame(renderFrame);
        return;
      }

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frame.data;

      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const brightness = (red + green + blue) / 3;
        const maxChannel = Math.max(red, green, blue);

        if (brightness < 22 && maxChannel < 32) {
          pixels[index + 3] = 0;
          continue;
        }

        if (brightness < 48 && maxChannel < 70) {
          pixels[index + 3] = Math.max(
            0,
            Math.round(((brightness - 22) / 26) * 255),
          );
        }
      }

      context.putImageData(frame, 0, 0);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    const start = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(renderFrame);
    };

    video.addEventListener("play", start);
    video.addEventListener("loadeddata", start);

    try {
      const playResult = video.play();
      if (playResult && typeof playResult.catch === "function") {
        void playResult.catch(() => undefined);
      }
    } catch {
      // Ambientes sem suporte a autoplay/media não devem quebrar a página.
    }

    return () => {
      video.removeEventListener("play", start);
      video.removeEventListener("loadeddata", start);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div className="relative h-[14rem] w-[9.5rem] md:h-[22rem] md:w-[15rem] lg:h-[27rem] lg:w-[18rem]">
      <video
        ref={videoRef}
        src="/assets/videos/404-zero.mp4"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        className="sr-only"
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        aria-label="Vídeo aplicado no zero do 404 com fundo removido"
      />
    </div>
  );
};

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePrimaryAction = () => {
    if (user) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f4f7fb_54%,#eef3f8_100%)] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.22),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,0.12),transparent_26%),radial-gradient(circle_at_18%_80%,rgba(148,163,184,0.14),transparent_24%)]" />
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.22) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-16 pt-44 text-center md:pt-56">
        <div className="pointer-events-none absolute inset-x-0 top-[12%] text-center font-black uppercase tracking-[-0.08em] text-slate-300/70">
          <div className="mx-auto flex max-w-[70rem] items-center justify-center gap-[8vw] md:gap-24">
            <span className="block text-[30vw] leading-none md:text-[22rem]">
              4
            </span>
            <span className="block w-[16vw] md:w-[12rem]" aria-hidden="true" />
            <span className="block text-[30vw] leading-none md:text-[22rem]">
              4
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-[14%] z-0 -translate-x-1/2 md:top-[11%]">
          <ZeroCutoutVideo />
        </div>

        <div className="relative mt-40 flex max-w-[23rem] flex-col items-center rounded-[1.8rem] border border-white/80 bg-white/58 px-4 py-5 shadow-[0_22px_56px_-46px_rgba(15,23,42,0.18)] backdrop-blur md:mt-48 md:px-5 md:py-6">
          <h1 className="max-w-sm text-base font-black leading-tight tracking-[-0.04em] text-slate-900 md:text-lg lg:text-[1.35rem]">
            Página não encontrada
          </h1>

          <p className="mt-2.5 max-w-xs text-[11px] leading-5 text-slate-600 md:text-xs md:leading-5">
            A rota acessada não existe ou foi movida. Voltamos tudo para uma
            composição limpa e direta para deixar o erro claro na tela inteira.
          </p>

          <div className="mt-4 flex w-full max-w-[12rem] flex-col items-center justify-center gap-3">
            <Button
              onClick={handlePrimaryAction}
              size="lg"
              className="h-9 min-w-[180px] rounded-[999px] bg-slate-950 px-5 text-xs text-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
              aria-label={user ? "Ir para a página inicial" : "Voltar ao login"}
            >
              {user ? <>Voltar para o início</> : <>Voltar para o início</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
