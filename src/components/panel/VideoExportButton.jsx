import React, { useState, useRef } from "react";
import { Video, Square, Download } from "lucide-react";

export default function VideoExportButton() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const getCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      throw new Error('Canvas not found. Make sure the 3D baseball is rendered.');
    }
    return canvas;
  };

  const startRecording = async () => {
    try {
      const canvas = getCanvas();
      const stream = canvas.captureStream(30); // 30 FPS
      
      // Try MP4 first (iPhone friendly), fallback to WebM
      let mimeType = 'video/mp4';
      let fileExtension = 'mp4';
      
      if (!MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/webm;codecs=vp8';
        fileExtension = 'webm';
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      
      chunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `spinning-baseball-${Date.now()}.${fileExtension}`;
        a.click();
        URL.revokeObjectURL(url);
        setIsProcessing(false);
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      setIsProcessing(true);
      recorderRef.current.stop();
      setIsRecording(false);
      recorderRef.current = null;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      alert("Failed to export video. Please try again.");
      setIsProcessing(false);
    }
  };

  const buttonText = isRecording 
    ? (isProcessing ? "Processing..." : "Stop Recording")
    : "Record Video";

  const buttonIcon = isRecording
    ? (isProcessing ? <Download className="h-4 w-4 animate-pulse" /> : <Square className="h-4 w-4" />)
    : <Video className="h-4 w-4" />;

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={`px-3 py-2 rounded-xl border transition inline-flex items-center gap-2 btn-glass ${
        isRecording ? "!bg-red-500/20 !border-red-500/50 !text-red-400" : ""
      } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {buttonIcon}
      {buttonText}
    </button>
  );
}