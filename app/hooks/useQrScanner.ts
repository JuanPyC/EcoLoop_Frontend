import { useState, useRef, useEffect } from "react";
import { binService } from "../services/binService";
import { transactionService } from "../services/transactionService";
import { Html5Qrcode } from "html5-qrcode";

const POINTS_BY_TYPE = {
  recyclable: 10,
  organic: 8,
  non_recyclable: 5,
};

const POINTS_PER_KG = {
  recyclable: 2,
  organic: 1.5,
  non_recyclable: 1,
};

const MAX_CAPACITY_KG = 120;

export function useQrScanner(userId: string, onScanSuccess: () => void) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    points?: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedBin, setScannedBin] = useState<any>(null);
  const [wasteAmount, setWasteAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldStartScanner, setShouldStartScanner] = useState(false);

  useEffect(() => {
    if (!shouldStartScanner || scannerRef.current) return;

    const initScanner = async () => {
      try {
        console.log("[useQrScanner] Initializing scanner...");
        
        const element = document.getElementById("qr-reader");
        if (!element) {
          console.error("[useQrScanner] QR reader element not found");
          return;
        }

        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (isProcessing) return;

            setIsProcessing(true);
            await handleScan(decodedText);

            if (scannerRef.current) {
              try {
                await scannerRef.current.stop();
              } catch (err) {
                console.error("[useQrScanner] Error stopping scanner after scan:", err);
              }
            }
            setIsScanning(false);
            setShouldStartScanner(false);
            setIsProcessing(false);
          },
          () => {}
        );

        setHasPermission(true);
      } catch (err) {
        console.error("[useQrScanner] Error starting scanner:", err);
        setHasPermission(false);
        setIsScanning(false);
        setShouldStartScanner(false);
        setScanResult({
          success: false,
          message: "No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara.",
        });
      }
    };

    const timer = setTimeout(initScanner, 100);
    return () => clearTimeout(timer);
  }, [shouldStartScanner]);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = () => {
    setHasPermission(null);
    setScanResult(null);
    setIsScanning(true);
    setShouldStartScanner(true);
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.error("[useQrScanner] Error stopping scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setShouldStartScanner(false);
  };

  const handleScan = async (qrCode: string) => {
    try {
      console.log("[useQrScanner] Scanned QR code:", qrCode);
      const bin = await binService.getBinByQr(qrCode);
      if (!bin) {
        setScanResult({
          success: false,
          message: "Código QR no válido. Por favor, escanea un código de una canasta de basura.",
        });
        return;
      }
      setScannedBin(bin);
    } catch (error) {
      console.error("[useQrScanner] Error processing scan:", error);
      setScanResult({
        success: false,
        message: "Error al procesar el escaneo o canasta no encontrada.",
      });
    }
  };

  const handleSubmitDeposit = async () => {
    if (!scannedBin || !wasteAmount) return;

    setIsSubmitting(true);

    try {
      const amount = Number.parseFloat(wasteAmount);
      if (isNaN(amount) || amount <= 0) {
        setScanResult({
          success: false,
          message: "Por favor, ingresa una cantidad válida mayor a 0.",
        });
        setIsSubmitting(false);
        return;
      }

      const currentWeight = scannedBin.current_weight || 0;
      const newWeight = Math.min(currentWeight + amount, MAX_CAPACITY_KG);
      const newCapacity = Math.round((newWeight / MAX_CAPACITY_KG) * 100);

      if (currentWeight >= MAX_CAPACITY_KG) {
        setScanResult({
          success: false,
          message: "Esta canasta está llena. Por favor, usa otra canasta o notifica al personal.",
        });
        setIsSubmitting(false);
        return;
      }

      const basePoints = POINTS_BY_TYPE[scannedBin.waste_type as keyof typeof POINTS_BY_TYPE];
      const pointsPerKg = POINTS_PER_KG[scannedBin.waste_type as keyof typeof POINTS_PER_KG];
      const totalPoints = Math.round(basePoints + amount * pointsPerKg);

      // Create transaction
      await transactionService.createTransaction({
        user_id: userId,
        bin_id: scannedBin.id,
        points_earned: totalPoints,
        waste_type: scannedBin.waste_type,
      });

      // Update bin capacity
      await binService.updateBinCapacity(scannedBin.id, newCapacity, newWeight);

      const wasteTypeLabel =
        scannedBin.waste_type === "recyclable"
          ? "reciclables"
          : scannedBin.waste_type === "organic"
            ? "orgánicos"
            : "no reciclables";

      setScanResult({
        success: true,
        message: `¡Excelente! Has depositado ${amount}kg de residuos ${wasteTypeLabel} en ${scannedBin.waste_stations?.name || "Estación"} y ganado ${totalPoints} EcoPoints. Capacidad actual: ${newCapacity}%`,
        points: totalPoints,
      });

      setScannedBin(null);
      setWasteAmount("");
      onScanSuccess();
    } catch (error) {
      console.error("[useQrScanner] Error submitting deposit:", error);
      setScanResult({
        success: false,
        message: "Error al registrar el depósito. Por favor, intenta de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelDeposit = () => {
    setScannedBin(null);
    setWasteAmount("");
    setScanResult(null);
  };

  return {
    isScanning,
    scanResult,
    isProcessing,
    hasPermission,
    scannedBin,
    wasteAmount,
    setWasteAmount,
    isSubmitting,
    startScanning,
    stopScanning,
    handleSubmitDeposit,
    handleCancelDeposit,
    setScanResult,
    MAX_CAPACITY_KG,
  };
}
export default useQrScanner;
