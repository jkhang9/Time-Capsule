import { useCallback, useEffect, useRef, useState } from 'react'
import { clunk, startHiss, whirr } from './audio/sfx.js'
import { MAX_SECONDS, decode, playTape, startRecording } from './audio/tape.js'

const REWIND_SECONDS = 0.9

// State machine for one cassette: empty -> recording -> recorded <-> (rewinding -> playing)
export function useTapeDeck() {
  const [status, setStatus] = useState('empty')
  const [seconds, setSeconds] = useState(0)
  const [micBlocked, setMicBlocked] = useState(false)
  const recorder = useRef(null)
  const player = useRef(null)
  const hiss = useRef(null)
  const tape = useRef(null) // { blob, buffer, duration }
  const clock = useRef({ start: 0, from: 0 }) // for recording time and rewind animation
  const progressRef = useRef(0)
  const statusRef = useRef('empty')
  statusRef.current = status

  // fraction of the tape's length that's been used, at the moment it's read
  const recordedFraction = () => Math.min(1, (tape.current?.duration ?? 0) / MAX_SECONDS)

  const getProgress = useCallback(() => {
    const s = statusRef.current
    const now = performance.now()
    if (s === 'recording') progressRef.current = Math.min(1, (now - clock.current.start) / 1000 / MAX_SECONDS)
    else if (s === 'rewinding') {
      const k = Math.min(1, (now - clock.current.start) / 1000 / REWIND_SECONDS)
      progressRef.current = clock.current.from * (1 - k)
    } else if (s === 'playing' && player.current) progressRef.current = player.current.position() / MAX_SECONDS
    return progressRef.current
  }, [])

  const getSpin = useCallback(() => {
    const s = statusRef.current
    if (s === 'recording' || s === 'playing') return 1
    if (s === 'rewinding') return -7
    return 0
  }, [])

  const getLevel = useCallback(() => recorder.current?.level() ?? player.current?.level() ?? 0, [])

  useEffect(() => {
    if (status !== 'recording' && status !== 'playing') return
    const id = setInterval(() => {
      if (statusRef.current === 'recording') {
        const s = (performance.now() - clock.current.start) / 1000
        setSeconds(s)
        if (s >= MAX_SECONDS) stop()
      } else if (player.current) setSeconds(player.current.position())
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const record = useCallback(async () => {
    if (statusRef.current !== 'empty') return
    clunk()
    try {
      recorder.current = await startRecording()
    } catch {
      setMicBlocked(true)
      return
    }
    hiss.current = startHiss(0.01)
    clock.current.start = performance.now()
    setSeconds(0)
    setStatus('recording')
  }, [])

  const stop = useCallback(async () => {
    const s = statusRef.current
    if (s === 'recording' && recorder.current) {
      clunk()
      statusRef.current = 'saving'
      setStatus('saving')
      const r = recorder.current
      recorder.current = null
      hiss.current?.()
      hiss.current = null
      const blob = await r.stop()
      try {
        const buffer = await decode(blob)
        tape.current = { blob, buffer, duration: buffer.duration }
        progressRef.current = recordedFraction()
        setSeconds(buffer.duration)
        setStatus('recorded')
      } catch {
        setStatus('empty')
      }
    } else if (s === 'playing') {
      clunk()
      player.current?.stop()
    }
  }, [])

  const play = useCallback(() => {
    if (statusRef.current !== 'recorded' || !tape.current) return
    clunk()
    clock.current = { start: performance.now(), from: progressRef.current }
    whirr(REWIND_SECONDS)
    setStatus('rewinding')
    setTimeout(() => {
      player.current = playTape(tape.current.buffer, {
        onEnd: () => {
          player.current = null
          setSeconds(tape.current?.duration ?? 0)
          setStatus('recorded')
        },
      })
      setStatus('playing')
    }, REWIND_SECONDS * 1000)
  }, [])

  // fallback when the mic isn't reachable: use an existing voice memo
  const loadFile = useCallback(async (file) => {
    try {
      const buffer = await decode(file)
      tape.current = { blob: file, buffer, duration: Math.min(buffer.duration, MAX_SECONDS) }
      progressRef.current = recordedFraction()
      setSeconds(tape.current.duration)
      clunk()
      setStatus('recorded')
      return true
    } catch {
      return false
    }
  }, [])

  const reset = useCallback(() => {
    player.current?.stop()
    player.current = null
    tape.current = null
    progressRef.current = 0
    setSeconds(0)
    setStatus('empty')
  }, [])

  const take = useCallback(() => tape.current, [])

  return { status, seconds, micBlocked, record, stop, play, loadFile, reset, take, getProgress, getSpin, getLevel }
}
