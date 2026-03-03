import { useRef, useState, useCallback, useEffect } from 'react'

export function useWebcam() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)           // ref — immune to StrictMode cleanup cycles
  const [hasPermission, setHasPermission] = useState(null)

  async function requestPermission() {
    // Don't request again if already have a live stream
    if (streamRef.current?.active) return
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 224, height: 224, facingMode: 'user' }
      })
      streamRef.current = s
      setHasPermission(true)
      attachStream()
    } catch {
      setHasPermission(false)
    }
  }

  function attachStream() {
    const video = videoRef.current
    const s = streamRef.current
    if (video && s) {
      video.srcObject = s
      video.play().catch(() => {}) // explicit play() needed when srcObject set programmatically
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Re-attach whenever videoRef becomes available (e.g. after conditional render)
  useEffect(() => {
    if (hasPermission && streamRef.current) {
      attachStream()
    }
  }, [hasPermission])

  // Cleanup only on true unmount
  useEffect(() => {
    return () => stopStream()
  }, [])

  const captureFrame = useCallback(() => {
    return new Promise((resolve) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !streamRef.current) return resolve(null)
      const ctx = canvas.getContext('2d')
      canvas.width = 224
      canvas.height = 224
      ctx.drawImage(video, 0, 0, 224, 224)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7)
    })
  }, [])

  return { videoRef, canvasRef, hasPermission, stream: streamRef.current, requestPermission, captureFrame, stopStream }
}
