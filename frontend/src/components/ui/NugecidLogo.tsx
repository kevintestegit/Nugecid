import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DEFAULT_NUGECID_LOGO_PREFERENCE,
  NUGECID_LOGO_PREFERENCE_CHANGE_EVENT,
  NUGECID_LOGO_PREFERENCE_KEY,
  readNugecidLogoPreference,
  resolveNugecidLogoTheme,
  type NugecidLogoPreference,
} from "@/lib/logoPreferences";

interface NugecidLogoProps {
  showText?: boolean;
  showAnimation?: boolean;
  className?: string;
}

export const NugecidLogo: React.FC<NugecidLogoProps> = ({
  showText = true,
  showAnimation = true,
  className = "",
}) => {
  const patternId = useId().replace(/:/g, "-");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [logoPreference, setLogoPreference] = useState<NugecidLogoPreference>(
    DEFAULT_NUGECID_LOGO_PREFERENCE,
  );

  useEffect(() => {
    setLogoPreference(readNugecidLogoPreference());

    const handlePreferenceChange = () => {
      setLogoPreference(readNugecidLogoPreference());
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === NUGECID_LOGO_PREFERENCE_KEY) {
        handlePreferenceChange();
      }
    };

    window.addEventListener(
      NUGECID_LOGO_PREFERENCE_CHANGE_EVENT,
      handlePreferenceChange,
    );
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        NUGECID_LOGO_PREFERENCE_CHANGE_EVENT,
        handlePreferenceChange,
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const theme = useMemo(
    () => resolveNugecidLogoTheme(new Date(), logoPreference),
    [logoPreference],
  );

  useEffect(() => {
    if (!showAnimation || (theme !== "worldCup2026" && theme !== "saoJoao")) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext("2d");
    } catch {
      return;
    }

    if (!context || typeof context.setTransform !== "function") {
      return;
    }

    const larguraVirtual = 120;
    const alturaVirtual = 120;
    const fDistancia = 80;
    const centroProjecaoX = 60;
    const horizonteProjecaoY = 50;
    const soloProjecaoY = 100;

    const bolaFisica = {
      x: 22,
      y: 35,
      z: 0,
      raio: 11,
      vx: 0,
      vy: 0,
      vz: 0,
      gravidade: 0.22,
      amortecimentoSolo: 0.72,
      deformacaoEixoX: 1,
      deformacaoEixoY: 1,
    };

    const metaAlvo = {
      x: 60,
      y: soloProjecaoY,
      z: 130,
      largura: 48,
      altura: 32,
    };

    type Particle = {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      cor: string;
      largura: number;
      altura: number;
      rotacao: number;
      velRotacao: number;
      vida: number;
      decaimento: number;
      gravidade: number;
    };

    const particleSystem: Particle[] = [];
    
    const worldCupPalette = ["#009a44", "#0033a0", "#d81e05", "#ffcd00", "#7b2cbf", "#f107a3"];
    const saoJoaoPalette = ["#f97316", "#facc15", "#ef4444", "#ea580c", "#eab308", "#ffffff"];
    const activePalette = theme === "saoJoao" ? saoJoaoPalette : worldCupPalette;

    const getRatio = () => window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 82;
      const height = rect.height || 82;
      const ratio = getRatio();
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
    };

    const project = (x: number, y: number, z: number) => {
      const escala = fDistancia / (fDistancia + z);
      const pX = centroProjecaoX + (x - centroProjecaoX) * escala;
      const pSoloY = horizonteProjecaoY + (soloProjecaoY - horizonteProjecaoY) * escala;
      const pY = pSoloY - (soloProjecaoY - y) * escala;

      return {
        x: pX,
        y: pY,
        scale: escala,
      };
    };

    const spawnConfetti = () => {
      for (let index = 0; index < 90; index += 1) {
        particleSystem.push({
          x: metaAlvo.x + (Math.random() * metaAlvo.largura - metaAlvo.largura / 2) * 0.8,
          y: metaAlvo.y - metaAlvo.altura * 0.5,
          z: metaAlvo.z,
          vx: Math.random() * 5 - 2.5,
          vy: -(Math.random() * 4 + 2.5),
          vz: -(Math.random() * 8 + 4),
          cor: activePalette[Math.floor(Math.random() * activePalette.length)],
          largura: Math.random() * 2 + 2,
          altura: Math.random() * 4 + 3,
          rotacao: Math.random() * Math.PI * 2,
          velRotacao: (Math.random() - 0.5) * 0.4,
          vida: 1,
          decaimento: Math.random() * 0.015 + 0.008,
          gravidade: 0.12,
        });
      }
    };

    let estadoAnimacao: "ressaltar" | "preparar" | "rematar" | "celebrar" | "fade" = "ressaltar";
    let contadorFrames = 0;
    let contagemRessaltos = 0;
    let temporizadorEstado = 0;
    let animationFrameId = 0;

    const drawBall = () => {
      const proj = project(bolaFisica.x, bolaFisica.y, bolaFisica.z);
      const rProjetado = bolaFisica.raio * proj.scale;

      if (rProjetado <= 0) {
        return;
      }

      const projSombra = project(bolaFisica.x, soloProjecaoY, bolaFisica.z);
      context.beginPath();
      context.ellipse(
        projSombra.x,
        projSombra.y,
        rProjetado * (1 - (soloProjecaoY - bolaFisica.y) * 0.008),
        rProjetado * 0.22 * (1 - (soloProjecaoY - bolaFisica.y) * 0.008),
        0,
        0,
        Math.PI * 2,
      );
      context.fillStyle = "rgba(0, 0, 0, 0.14)";
      context.fill();

      context.save();
      context.translate(proj.x, proj.y);
      context.scale(bolaFisica.deformacaoEixoX, bolaFisica.deformacaoEixoY);

      const sphereGradient = context.createRadialGradient(
        -rProjetado * 0.2,
        -rProjetado * 0.2,
        rProjetado * 0.05,
        0,
        0,
        rProjetado,
      );
      sphereGradient.addColorStop(0, "#ffffff");
      sphereGradient.addColorStop(0.7, "#f1f5f9");
      sphereGradient.addColorStop(1, '#cbd5e1');

      context.beginPath();
      context.arc(0, 0, rProjetado, 0, Math.PI * 2);
      context.fillStyle = sphereGradient;
      context.fill();

      const rotZ = bolaFisica.z * 0.04;
      const rotY = estadoAnimacao === "ressaltar" ? contadorFrames * 0.025 : bolaFisica.z * 0.045;

      context.save();
      context.rotate(rotY);

      context.strokeStyle = "rgba(30, 41, 59, 0.35)";
      context.lineWidth = 0.6 * proj.scale;
      context.beginPath();
      context.arc(0, 0, rProjetado * 0.75, 0, Math.PI * 2);
      context.stroke();

      const panelColors = ["#0033a0", "#009a44", "#d81e05"];
      for (let index = 0; index < 3; index += 1) {
        context.save();
        context.rotate((index * Math.PI * 2) / 3 + rotZ);
        context.beginPath();
        context.moveTo(0, -rProjetado * 0.15);
        context.quadraticCurveTo(rProjetado * 0.35, -rProjetado * 0.2, rProjetado * 0.75, -rProjetado * 0.4);
        context.quadraticCurveTo(rProjetado * 0.55, -rProjetado * 0.7, 0, -rProjetado * 0.5);
        context.closePath();
        context.fillStyle = panelColors[index];
        context.fill();
        context.restore();
      }

      context.restore();

      const shineGradient = context.createLinearGradient(0, -rProjetado, 0, rProjetado);
      shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      shineGradient.addColorStop(0.35, "rgba(255, 255, 255, 0.05)");
      shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      context.beginPath();
      context.arc(0, 0, rProjetado, 0, Math.PI * 2);
      context.fillStyle = shineGradient;
      context.fill();

      context.strokeStyle = "#1e293b";
      context.lineWidth = 1.2 * proj.scale;
      context.stroke();
      context.restore();
    };

    const drawPlayer = () => {
      const proj = project(bolaFisica.x, bolaFisica.y, bolaFisica.z);
      const scale = proj.scale;
      const x = proj.x;
      const y = proj.y;
      const h = 18 * scale;
      const headR = 3 * scale;
      const neckY = y - h + 2 * headR;
      const hipY = y - h / 2;

      const projSombra = project(bolaFisica.x, soloProjecaoY, bolaFisica.z);
      context.beginPath();
      context.ellipse(
        projSombra.x,
        projSombra.y,
        8 * scale * (1 - (soloProjecaoY - bolaFisica.y) * 0.008),
        2.5 * scale * (1 - (soloProjecaoY - bolaFisica.y) * 0.008),
        0,
        0,
        Math.PI * 2,
      );
      context.fillStyle = "rgba(0, 0, 0, 0.12)";
      context.fill();

      context.strokeStyle = "#1e293b";
      context.lineWidth = 1.6 * scale;
      context.lineCap = "round";
      context.lineJoin = "round";

      let headOffset = 0;
      if (estadoAnimacao === "ressaltar" && bolaFisica.deformacaoEixoY < 1) {
        headOffset = (1 - bolaFisica.deformacaoEixoY) * 3.5 * scale;
      }

      context.beginPath();
      context.arc(x, y - h + headR + headOffset, headR, 0, Math.PI * 2);
      context.fillStyle = "#f8fafc";
      context.fill();
      context.stroke();

      context.beginPath();
      context.moveTo(x, neckY + headOffset);
      context.lineTo(x, hipY);
      context.stroke();

      if (estadoAnimacao === "ressaltar") {
        const bend = (1 - bolaFisica.deformacaoEixoY) * 5 * scale;
        context.beginPath();
        context.moveTo(x, neckY + 1 * scale + headOffset);
        context.lineTo(x - 4 * scale, neckY - 2 * scale);
        context.moveTo(x, neckY + 1 * scale + headOffset);
        context.lineTo(x + 4 * scale, neckY - 2 * scale);
        context.stroke();

        context.beginPath();
        context.moveTo(x, hipY);
        context.lineTo(x - 3 * scale, hipY + 4 * scale - bend * 0.5);
        canvas.getContext("2d")!.lineTo(x - 2 * scale, y);
        context.moveTo(x, hipY);
        context.lineTo(x + 3 * scale, hipY + 4 * scale - bend * 0.5);
        context.lineTo(x + 2 * scale, y);
        context.stroke();
      } else if (estadoAnimacao === "preparar") {
        context.beginPath();
        context.moveTo(x, neckY + 2 * scale);
        context.lineTo(x - 3 * scale, neckY + 5 * scale);
        context.moveTo(x, neckY + 2 * scale);
        context.lineTo(x + 3 * scale, neckY + 5 * scale);
        context.stroke();

        context.beginPath();
        context.moveTo(x, hipY + 1 * scale);
        context.lineTo(x - 4 * scale, hipY + 5 * scale);
        context.lineTo(x - 2 * scale, y);
        context.moveTo(x, hipY + 1 * scale);
        context.lineTo(x + 4 * scale, hipY + 5 * scale);
        context.lineTo(x + 2 * scale, y);
        context.stroke();
      } else if (estadoAnimacao === "rematar") {
        context.beginPath();
        context.moveTo(x, neckY + 1 * scale);
        context.lineTo(x + 5 * scale, neckY - 2 * scale);
        context.moveTo(x, neckY + 1 * scale);
        context.lineTo(x + 4 * scale, neckY - 4 * scale);
        context.stroke();

        context.beginPath();
        context.moveTo(x, hipY);
        context.lineTo(x - 5 * scale, hipY - 2 * scale);
        context.lineTo(x - 7 * scale, hipY + 1 * scale);
        context.moveTo(x, hipY);
        context.lineTo(x - 3 * scale, hipY - 4 * scale);
        context.lineTo(x - 4 * scale, hipY);
        context.stroke();
      } else if (estadoAnimacao === "celebrar") {
        context.beginPath();
        context.moveTo(x, neckY + 1 * scale);
        context.lineTo(x - 4 * scale, neckY - 7 * scale);
        context.moveTo(x, neckY + 1 * scale);
        context.lineTo(x + 4 * scale, neckY - 7 * scale);
        context.stroke();

        context.beginPath();
        context.moveTo(x, hipY);
        context.lineTo(x - 2 * scale, y);
        context.moveTo(x, hipY);
        context.lineTo(x + 2 * scale, y);
        context.stroke();
      } else {
        context.beginPath();
        context.moveTo(x, neckY + 1 * scale);
        context.lineTo(x - 3 * scale, neckY + 6 * scale);
        context.moveTo(x, neckY + 1 * scale);
        context.lineTo(x + 3 * scale, neckY + 6 * scale);
        context.stroke();

        context.beginPath();
        context.moveTo(x, hipY);
        context.lineTo(x - 2 * scale, y);
        context.moveTo(x, hipY);
        context.lineTo(x + 2 * scale, y);
        context.stroke();
      }
    };

    const drawFire = () => {
      const proj = project(60, soloProjecaoY, 65);
      const scale = proj.scale;
      const x = proj.x;
      const y = proj.y;
      const size = 10 * scale;
      const flicker = Math.sin(contadorFrames * 0.18) * 1.5 * scale;
      const flameH = 15 * scale + flicker;
      const flameW = 7 * scale;

      context.save();
      context.strokeStyle = "#78350f";
      context.lineWidth = 2.5 * scale;
      context.lineCap = "round";

      context.beginPath();
      context.moveTo(x - size, y - 2 * scale);
      context.lineTo(x + size, y - 2 * scale);
      context.stroke();

      context.beginPath();
      context.moveTo(x - size * 0.7, y - 5 * scale);
      context.lineTo(x + size * 0.7, y + 2 * scale);
      context.stroke();

      context.beginPath();
      context.moveTo(x + size * 0.7, y - 5 * scale);
      context.lineTo(x - size * 0.7, y + 2 * scale);
      context.stroke();

      context.fillStyle = "#ef4444";
      context.beginPath();
      context.moveTo(x - flameW, y - 3 * scale);
      context.quadraticCurveTo(x - flameW * 1.4, y - flameH * 0.5, x, y - flameH);
      context.quadraticCurveTo(x + flameW * 1.4, y - flameH * 0.5, x + flameW, y - 3 * scale);
      context.closePath();
      context.fill();

      context.fillStyle = "#f97316";
      context.beginPath();
      context.moveTo(x - flameW * 0.7, y - 3 * scale);
      context.quadraticCurveTo(x - flameW * 1.0, y - flameH * 0.45, x, y - flameH * 0.8);
      context.quadraticCurveTo(x + flameW * 1.0, y - flameH * 0.45, x + flameW * 0.7, y - 3 * scale);
      context.closePath();
      context.fill();

      context.fillStyle = "#facc15";
      context.beginPath();
      context.moveTo(x - flameW * 0.4, y - 3 * scale);
      context.quadraticCurveTo(x - flameW * 0.6, y - flameH * 0.35, x, y - flameH * 0.6);
      context.quadraticCurveTo(x + flameW * 0.6, y - flameH * 0.35, x + flameW * 0.4, y - 3 * scale);
      context.closePath();
      context.fill();
      context.restore();
    };

    const updatePhysics = () => {
      bolaFisica.deformacaoEixoX += (1 - bolaFisica.deformacaoEixoX) * 0.15;
      bolaFisica.deformacaoEixoY += (1 - bolaFisica.deformacaoEixoY) * 0.15;

      for (let index = particleSystem.length - 1; index >= 0; index -= 1) {
        const particle = particleSystem[index];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;
        particle.vy += particle.gravidade;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.vz *= 0.98;
        particle.rotacao += particle.velRotacao;
        particle.vida -= particle.decaimento;
        if (particle.vida <= 0 || particle.z < -40) {
          particleSystem.splice(index, 1);
        }
      }

      if (estadoAnimacao === "ressaltar") {
        bolaFisica.vy += bolaFisica.gravidade;
        bolaFisica.y += bolaFisica.vy;

        if (bolaFisica.y + bolaFisica.raio >= soloProjecaoY) {
          bolaFisica.y = soloProjecaoY - bolaFisica.raio;
          contagemRessaltos += 1;
          if (contagemRessaltos >= 2) {
            bolaFisica.vy = 0;
            estadoAnimacao = "preparar";
            temporizadorEstado = 0;
          } else {
            bolaFisica.vy = -bolaFisica.vy * bolaFisica.amortecimentoSolo;
          }
          bolaFisica.deformacaoEixoX = 1.25;
          bolaFisica.deformacaoEixoY = 0.75;
        }
      } else if (estadoAnimacao === "preparar") {
        bolaFisica.vy = 0;
        bolaFisica.vx = 0;
        bolaFisica.y = soloProjecaoY - bolaFisica.raio;

        temporizadorEstado += 1;
        if (temporizadorEstado > 20) {
          bolaFisica.vx = (metaAlvo.x - bolaFisica.x) / 25;
          bolaFisica.vy = -3.1;
          bolaFisica.vz = 5.2;
          estadoAnimacao = "rematar";
          temporizadorEstado = 0;
        }
      } else if (estadoAnimacao === "rematar") {
        bolaFisica.x += bolaFisica.vx;
        bolaFisica.y += bolaFisica.vy;
        bolaFisica.z += bolaFisica.vz;
        bolaFisica.vy += bolaFisica.gravidade;

        if (bolaFisica.z >= metaAlvo.z) {
          const insideTarget =
            bolaFisica.x >= metaAlvo.x - metaAlvo.largura / 2 &&
            bolaFisica.x <= metaAlvo.x + metaAlvo.largura / 2 &&
            bolaFisica.y >= metaAlvo.y - metaAlvo.altura &&
            bolaFisica.y <= metaAlvo.y;

          if (insideTarget) {
            bolaFisica.z = metaAlvo.z;
            bolaFisica.vx = 0;
            bolaFisica.vy = 0;
            bolaFisica.vz = 0;
            spawnConfetti();
            estadoAnimacao = "celebrar";
            temporizadorEstado = 0;
          } else {
            estadoAnimacao = "fade";
            temporizadorEstado = 0;
          }
        }
      } else if (estadoAnimacao === "celebrar") {
        bolaFisica.vx = 0;
        bolaFisica.vy = 0;
        bolaFisica.vz = 0;
        temporizadorEstado += 1;
        if (temporizadorEstado > 110) {
          estadoAnimacao = "fade";
          temporizadorEstado = 0;
        }
      } else if (estadoAnimacao === "fade") {
        temporizadorEstado += 1;
        if (temporizadorEstado > 15) {
          bolaFisica.x = 20 + Math.random() * 15;
          bolaFisica.y = 35;
          bolaFisica.z = 0;
          bolaFisica.vx = 0;
          bolaFisica.vy = 0;
          bolaFisica.vz = 0;
          contagemRessaltos = 0;
          particleSystem.length = 0;
          estadoAnimacao = "ressaltar";
          temporizadorEstado = 0;
        }
      }

      contadorFrames += 1;
    };

    const drawConfetti = () => {
      const sortedParticles = [...particleSystem].sort((left, right) => right.z - left.z);
      for (const particle of sortedParticles) {
        const proj = project(particle.x, particle.y, particle.z);
        if (proj.scale <= 0) {
          continue;
        }

        context.save();
        context.translate(proj.x, proj.y);
        context.rotate(particle.rotacao);
        context.fillStyle = particle.cor;
        context.globalAlpha = particle.vida;
        context.fillRect(
          -(particle.largura * proj.scale) / 2,
          -(particle.altura * proj.scale) / 2,
          particle.largura * proj.scale,
          particle.altura * proj.scale,
        );
        context.restore();
      }
      context.globalAlpha = 1;
    };

    const frame = () => {
      updatePhysics();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.scale(canvas.width / larguraVirtual, canvas.height / alturaVirtual);
      
      if (theme === 'saoJoao') {
        if (bolaFisica.z >= 65) {
          drawPlayer();
          drawFire();
        } else {
          drawFire();
          drawPlayer();
        }
      } else {
        drawBall();
      }
      
      drawConfetti();
      context.restore();
      animationFrameId = window.requestAnimationFrame(frame);
    };

    resize();
    frame();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [showAnimation, theme]);

  const themeConfig = {
    worldCup2026: {
      colors: [
        "#22C55E",
        "#3B82F6",
        "#3B82F6",
        "#3B82F6",
        "#3B82F6",
        "#3B82F6",
        "#FACC15",
      ],
      patternStroke: "rgba(255, 255, 255, 0.4)",
      patternCircle: "rgba(255, 255, 255, 0.2)",
    },
    saoJoao: {
      colors: [
        "#EA580C",
        "#F59E0B",
        "#EF4444",
        "#FACC15",
        "#EA580C",
        "#F59E0B",
        "#EF4444",
      ],
      patternStroke: "rgba(251, 146, 60, 0.4)",
      patternCircle: "rgba(253, 224, 71, 0.3)",
    },
    easter: {
      colors: [
        "#60A5FA",
        "#F472B6",
        "#A78BFA",
        "#34D399",
        "#FBBF24",
        "#2DD4BF",
        "#818CF8",
      ],
      patternStroke: "rgba(255, 255, 255, 0.4)",
      patternCircle: "rgba(255, 255, 255, 0.5)",
    },
    mothersDay: {
      colors: [
        "#F43F5E",
        "#EC4899",
        "#D946EF",
        "#A855F7",
        "#8B5CF6",
        "#6366F1",
        "#4F46E5",
      ],
      patternStroke: "rgba(255, 255, 255, 0.3)",
      patternCircle: "rgba(255, 255, 255, 0.4)",
    },
    standard: {
      colors: [
        "#3B82F6",
        "#3B82F6",
        "#3B82F6",
        "#3B82F6",
        "#3B82F6",
        "#3B82F6",
        "#3B82F6",
      ],
      patternStroke: "rgba(255, 255, 255, 0.2)",
      patternCircle: "rgba(255, 255, 255, 0.3)",
    },
  }[theme];

  const SharedDefs = () => (
    <defs>
      {theme === "worldCup2026" || theme === "saoJoao" ? (
        <pattern
          id={patternId}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 5 0 L 10 2.5 L 10 7.5 L 5 10 L 0 7.5 L 0 2.5 Z"
            fill="none"
            stroke={themeConfig.patternStroke}
            strokeWidth="0.5"
            opacity="0.5"
          />
        </pattern>
      ) : (
        <pattern
          id={patternId}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(20)"
        >
          <path
            d="M 0 4 L 4 0 L 8 4 L 12 0 L 16 4"
            fill="none"
            stroke={themeConfig.patternStroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="11" r="1.5" fill={themeConfig.patternCircle} />
          <circle cx="0" cy="11" r="1" fill={themeConfig.patternStroke} />
        </pattern>
      )}
    </defs>
  );

  const EasterElements = ({ compact = false }) => (
    <g transform={compact ? "translate(0, 5)" : "translate(0, 0)"}>
      <path
        d={
          compact ? "M 4 12 C 12 4, 20 4, 28 12" : "M 5 20 C 30 8, 60 8, 90 20"
        }
        stroke="#9CA3AF"
        strokeWidth={compact ? "1" : "1.5"}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={compact ? "2 2" : "4 4"}
        opacity="0.6"
      />
      <path
        d={
          compact
            ? "M 8 11 C 6 4, 11 1, 13 8 C 15 1, 20 4, 18 11 Z"
            : "M 12 18 C 10 10, 16 6, 18 14 C 20 6, 26 10, 24 18 Z"
        }
        fill="#F3F4F6"
        stroke="#D1D5DB"
        strokeWidth="0.5"
      />
      <path
        d={
          compact
            ? "M 9.5 10 C 8.5 6, 10.5 4, 11.5 8 C 12.5 4, 14.5 6, 13.5 10 Z"
            : "M 13.5 17 C 12 12, 15 9, 16.5 15 C 18 9, 21 12, 19.5 17 Z"
        }
        fill="#F472B6"
        opacity="0.9"
      />
      {!compact && (
        <>
          <g transform="translate(35, 12) rotate(-15)">
            <ellipse
              cx="0"
              cy="0"
              rx="4.5"
              ry="6.5"
              fill="#60A5FA"
              opacity="0.9"
            />
            <path
              d="M -4 0 Q 0 3 4 0"
              stroke="#FFF"
              strokeWidth="1"
              fill="none"
            />
          </g>
          <g transform="translate(55, 9) rotate(10)">
            <ellipse cx="0" cy="0" rx="5" ry="7" fill="#FBBF24" opacity="0.9" />
            <path
              d="M -4.5 0 Q 0 -3 4.5 0"
              stroke="#FFF"
              strokeWidth="1"
              fill="none"
            />
            <circle cx="0" cy="3" r="1" fill="#FFF" />
          </g>
          <g transform="translate(75, 14) rotate(-10)">
            <ellipse
              cx="0"
              cy="0"
              rx="4"
              ry="5.5"
              fill="#A78BFA"
              opacity="0.9"
            />
            <path
              d="M -3.5 -1 L 3.5 -1 M -3.5 1 L 3.5 1"
              stroke="#FFF"
              strokeWidth="0.8"
              fill="none"
            />
          </g>
        </>
      )}
      {compact && (
        <g transform="translate(23, 8) rotate(15)">
          <ellipse cx="0" cy="0" rx="3" ry="4.5" fill="#60A5FA" opacity="0.9" />
          <path
            d="M -2.5 0 Q 0 1.5 2.5 0"
            stroke="#FFF"
            strokeWidth="0.5"
            fill="none"
          />
        </g>
      )}
    </g>
  );

  const MothersDayElements = ({ compact = false }) => (
    <g transform={compact ? "translate(0, 0)" : "translate(0, 0)"}>
      <g
        transform={
          compact
            ? "translate(22, 15) scale(1.2)"
            : "translate(18, 12) scale(1.5)"
        }
      >
        <path
          d="M 0 -2 C -1 -4, -3 -4, -4 -2 C -4 1, 0 4, 0 4 C 0 4, 4 1, 4 -2 C 3 -4, 1 -4, 0 -2"
          fill="#F43F5E"
          opacity="0.9"
        />
      </g>
      {!compact && (
        <>
          <g transform="translate(45, 18) rotate(-15) scale(1.2)">
            <path
              d="M 0 -2 C -1 -4, -3 -4, -4 -2 C -4 1, 0 4, 0 4 C 0 4, 4 1, 4 -2 C 3 -4, 1 -4, 0 -2"
              fill="#EC4899"
              opacity="0.8"
            />
          </g>
          <g transform="translate(70, 10) rotate(15)">
            <path
              d="M 0 -2 C -1 -4, -3 -4, -4 -2 C -4 1, 0 4, 0 4 C 0 4, 4 1, 4 -2 C 3 -4, 1 -4, 0 -2"
              fill="#D946EF"
              opacity="0.8"
            />
          </g>
          <path
            d="M 90 25 Q 95 15, 105 20 M 105 20 L 103 15 M 105 20 L 110 18"
            stroke="#10B981"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
        </>
      )}
    </g>
  );

  const WorldCupElements = ({ compact = false }) => (
    <g transform={compact ? "translate(0, 0)" : "translate(0, 0)"}>
      <g fill="#eab308">
        <g transform={compact ? "translate(11, 9) scale(0.55)" : "translate(55, 11) scale(0.72)"}>
          <path d="M 0 -6 L 1.8 -1.8 L 6 -1.8 L 2.6 0.8 L 3.8 5 L 0 2.6 L -3.8 5 L -2.6 0.8 L -6 -1.8 L -1.8 -1.8 Z" />
        </g>
        <g transform={compact ? "translate(18, 5) scale(0.65)" : "translate(75, 8) scale(0.82)"}>
          <path d="M 0 -6 L 1.8 -1.8 L 6 -1.8 L 2.6 0.8 L 3.8 5 L 0 2.6 L -3.8 5 L -2.6 0.8 L -6 -1.8 L -1.8 -1.8 Z" />
        </g>
        <g transform={compact ? "translate(25, 2) scale(0.75)" : "translate(100, 6) scale(0.95)"}>
          <path d="M 0 -6 L 1.8 -1.8 L 6 -1.8 L 2.6 0.8 L 3.8 5 L 0 2.6 L -3.8 5 L -2.6 0.8 L -6 -1.8 L -1.8 -1.8 Z" />
        </g>
        <g transform={compact ? "translate(32, 5) scale(0.65)" : "translate(125, 8) scale(0.82)"}>
          <path d="M 0 -6 L 1.8 -1.8 L 6 -1.8 L 2.6 0.8 L 3.8 5 L 0 2.6 L -3.8 5 L -2.6 0.8 L -6 -1.8 L -1.8 -1.8 Z" />
        </g>
        <g transform={compact ? "translate(39, 9) scale(0.55)" : "translate(145, 11) scale(0.72)"}>
          <path d="M 0 -6 L 1.8 -1.8 L 6 -1.8 L 2.6 0.8 L 3.8 5 L 0 2.6 L -3.8 5 L -2.6 0.8 L -6 -1.8 L -1.8 -1.8 Z" />
        </g>
      </g>

      <path
        d={compact ? "M 2 31 Q 17 27 32 31" : "M 5 68 Q 50 62 100 67 T 170 58 Q 130 68 80 70 T 5 68"}
        fill="#10B981"
      />
      <path
        d={compact ? "M 4 34 Q 18 30 31 34" : "M 15 72 Q 60 66 110 70 T 178 61 L 180 63 Q 120 73 60 75 T 15 72"}
        fill="#047857"
        opacity="0.8"
      />

      <g transform={compact ? "translate(29, 16) scale(0.42)" : "translate(164, 44) scale(0.7)"}>
        <path
          d="M 0,8 L 10,0 L 20,8 L 20,16 C 20,20 10,23 10,23 C 10,23 0,20 0,16 Z"
          fill="#0033a0"
          stroke="#facc15"
          strokeWidth="1.2"
        />
        <path d="M 10,3 L 10,19 M 4,11 L 16,11" stroke="#ffffff" strokeWidth="2" />
        <path d="M 10,4 L 10,18 M 5,11 L 15,11" stroke="#10b981" stroke-width="0.8" />
        <g fill="#facc15" transform="translate(0, -5) scale(0.8)">
          <path d="M 3,2 L 4,4 L 6,4 L 4.5,5 L 5,7 L 3,6 L 1,7 L 1.5,5 L 0,4 L 2,4 Z" />
          <path d="M 12,0 L 13,2 L 15,2 L 13.5,3 L 14,5 L 12,4 L 10,5 L 10.5,3 L 9,2 L 11,2 Z" />
          <path d="M 21,2 L 22,4 L 24,4 L 22.5,5 L 23,7 L 21,6 L 19,7 L 19.5,5 L 18,4 L 20,4 Z" />
        </g>
      </g>
    </g>
  );

  const SaoJoaoElements = ({ compact = false }) => (
    <g transform={compact ? "translate(0, 1)" : "translate(0, 0)"}>
      {compact ? (
        <>
          <path
            d="M 5 13 Q 18 5, 31 13"
            stroke="#94A3B8"
            strokeWidth="0.8"
            fill="none"
            strokeDasharray="1 1"
            opacity="0.55"
          />
          <polygon points="9,11 15,11 15,18 12,15 9,18" fill="#EF4444" />
          <polygon points="19,8 25,8 25,15 22,12 19,15" fill="#FACC15" />
          <g transform="translate(26, 23) scale(0.42)">
            <path
              d="M 2 18 L 18 10 M 18 18 L 2 10"
              stroke="#78350F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 10 0 C 3 8, 5 14, 10 16 C 15 14, 17 8, 10 0 Z"
              fill="#EF4444"
              opacity="0.9"
            />
            <path
              d="M 10 4 C 6 10, 7 14, 10 16 C 13 14, 14 10, 10 4 Z"
              fill="#F97316"
              opacity="0.95"
            />
            <path
              d="M 10 8 C 8 11, 8 14, 10 16 C 12 14, 12 11, 10 8 Z"
              fill="#FACC15"
            />
          </g>
        </>
      ) : (
        <>
          <path
            d="M 5 18 Q 90 6, 175 18"
            stroke="#94A3B8"
            strokeWidth="1"
            fill="none"
            strokeDasharray="1 1"
            opacity="0.55"
          />
          <g>
            <polygon points="22,16 34,16 34,28 28,23 22,28" fill="#EF4444" />
            <polygon points="45,13 57,13 57,25 51,20 45,25" fill="#3B82F6" />
            <polygon points="68,12 80,12 80,24 74,19 68,24" fill="#10B981" />
            <polygon points="91,12 103,12 103,24 97,19 91,24" fill="#FACC15" />
            <polygon
              points="114,13 126,13 126,25 120,20 114,25"
              fill="#EC4899"
            />
            <polygon
              points="137,16 149,16 149,28 143,23 137,28"
              fill="#F97316"
            />
          </g>
          <g transform="translate(150, 30) scale(0.72)">
            <path
              d="M 2 18 L 18 10 M 18 18 L 2 10"
              stroke="#78350F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 10 0 C 3 8, 5 14, 10 16 C 15 14, 17 8, 10 0 Z"
              fill="#EF4444"
              opacity="0.9"
            />
            <path
              d="M 10 4 C 6 10, 7 14, 10 16 C 13 14, 14 10, 10 4 Z"
              fill="#F97316"
              opacity="0.95"
            />
            <path
              d="M 10 8 C 8 11, 8 14, 10 16 C 12 14, 12 11, 10 8 Z"
              fill="#FACC15"
            />
          </g>
          <g transform="translate(8, 10) scale(0.58)">
            <polygon
              points="10,0 16,8 10,16 4,8"
              fill="#F59E0B"
              stroke="#EA580C"
              strokeWidth="0.8"
            />
            <line
              x1="10"
              y1="16"
              x2="10"
              y2="20"
              stroke="#EF4444"
              strokeWidth="0.8"
            />
            <circle cx="10" cy="20" r="0.8" fill="#FACC15" />
          </g>
        </>
      )}
    </g>
  );

  if (showText) {
    const shouldRenderCanvas = showAnimation && (theme === "worldCup2026" || theme === "saoJoao");

    return (
      <div
        className={
          className
            ? `inline-flex items-center overflow-visible ${className}`
            : "inline-flex items-center overflow-visible"
        }
      >
        <svg
          viewBox="0 0 180 55"
          className="block h-full w-auto"
          xmlns="http://www.w3.org/2000/svg"
          data-theme={theme}
        >
          <SharedDefs />

          <text
            x="0"
            y="45"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="28"
            fontWeight="700"
            letterSpacing="0.5"
          >
            {"NUGECID".split("").map((char, i) => (
              <tspan key={i} fill={themeConfig.colors[i]}>
                {char}
              </tspan>
            ))}
          </text>

          <text
            x="0"
            y="45"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="28"
            fontWeight="700"
            letterSpacing="0.5"
            fill={`url(#${patternId})`}
            pointerEvents="none"
          >
            NUGECID
          </text>

          {theme === "easter" && <EasterElements />}
          {theme === "mothersDay" && <MothersDayElements />}
          {theme === "worldCup2026" && <WorldCupElements />}
          {theme === "saoJoao" && <SaoJoaoElements />}
        </svg>

        {shouldRenderCanvas && (
          <canvas
            ref={canvasRef}
            className="ml-[-14px] mt-3 block h-[82px] w-[82px] flex-shrink-0 overflow-hidden rounded-[10px] bg-transparent"
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 35 50"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      data-theme={theme}
    >
      <SharedDefs />

      <text
        x="5"
        y="45"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="32"
        fontWeight="700"
        fill={themeConfig.colors[0]}
      >
        N
      </text>

      <text
        x="5"
        y="45"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="32"
        fontWeight="700"
        fill={`url(#${patternId})`}
        style={{ pointerEvents: "none" }}
      >
        N
      </text>

      {theme === "easter" && <EasterElements compact />}
      {theme === "mothersDay" && <MothersDayElements compact />}
      {theme === "worldCup2026" && <WorldCupElements compact />}
      {theme === "saoJoao" && <SaoJoaoElements compact />}
    </svg>
  );
};
