import React, { useState, useRef, useEffect } from "react";

const SignaturePad = ({
  onChange,
}: {
  onChange: (dataUrl: string) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  const handleEnd = () => {
    const dataUrl = canvasRef.current!.toDataURL("image/png");
    onChange(dataUrl);
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let drawing = false;

    const start = (e: MouseEvent) => {
      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const draw = (e: MouseEvent) => {
      if (!drawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    const end = () => {
      drawing = false;
      handleEnd();
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
    };
  }, []);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="border border-gray-300"
      />
      <button onClick={clear} className="text-sm text-blue-600 mt-1">
        Clear
      </button>
    </div>
  );
};

export default SignaturePad;
