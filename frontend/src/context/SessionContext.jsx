import { createContext, useContext, useState } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null)
  const [studentName, setStudentName] = useState('')
  const [topic, setTopic] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isActive, setIsActive] = useState(false)

  function startSession(id, name, topicVal, url) {
    setSessionId(id)
    setStudentName(name)
    setTopic(topicVal)
    setVideoUrl(url)
    setIsActive(true)
  }

  function clearSession() {
    setSessionId(null)
    setStudentName('')
    setTopic('')
    setVideoUrl('')
    setIsActive(false)
  }

  return (
    <SessionContext.Provider value={{
      sessionId, studentName, topic, videoUrl, isActive,
      startSession, clearSession,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
