import { useRef, useState, useCallback, useEffect } from 'react'

export function useWebcam() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [hasPermission, setHasPermission] = useState(null) // null=unknown, true, false
  const [stream, setStream] = useState(null)

  async function requestPermission() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 224, height: 224, facingMode: 'user' }
      })
      setStream(s)
      setHasPermission(true)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch {
      setHasPermission(false)
    }
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }

  // Returns a Promise<Blob|null> — captured JPEG frame
  const captureFrame = useCallback(() => {
    return new Promise((resolve) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !stream) return resolve(null)
      const ctx = canvas.getContext('2d')
      canvas.width = 224
      canvas.height = 224
      ctx.drawImage(video, 0, 0, 224, 224)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7)
    })
  }, [stream])

  // Attach stream to video element whenever stream becomes available
  // (videoRef may not exist yet when requestPermission() first runs)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopStream()
  }, [stream])

  return { videoRef, canvasRef, hasPermission, stream, requestPermission, captureFrame, stopStream }
}
