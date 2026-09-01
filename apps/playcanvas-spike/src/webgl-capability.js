export function supportsRequiredWebGL(canvas) {
  if (!canvas || typeof canvas.getContext !== "function") return false;
  try {
    return Boolean(canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      failIfMajorPerformanceCaveat: false,
    }));
  } catch {
    return false;
  }
}

export function rendererFailureMessage(reason = "unavailable") {
  if (reason === "lost") {
    return "3D-КОНТЕКСТ ПОТЕРЯН. ПЕРЕЗАГРУЗИ КОМНАТУ.";
  }
  return "WEBGL2 НЕДОСТУПЕН. ОТКРОЙ ИГРУ В SAFARI ИЛИ CHROME БЕЗ РЕЖИМА ЭКОНОМИИ.";
}
