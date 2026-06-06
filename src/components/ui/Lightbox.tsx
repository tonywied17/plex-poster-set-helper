import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Lightbox.module.css'

export interface LightboxImage {
  url: string
  label?: string
  caption?: string
  badge?: React.ReactNode
}

interface LightboxProps {
  images: LightboxImage[]
  index: number
  onClose: () => void
}

export default function Lightbox({ images, index, onClose }: LightboxProps) {
  const [i, setI] = useState(index)
  const [dir, setDir] = useState(0)

  useEffect(() => setI(index), [index])

  const go = useCallback((delta: number) => {
    setDir(delta)
    setI(prev => (prev + delta + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // Preload neighbours for snappy navigation
  useEffect(() => {
    for (const d of [1, -1]) {
      const n = images[(i + d + images.length) % images.length]
      if (n) { const img = new Image(); img.src = n.url }
    }
  }, [i, images])

  const cur = images[i]
  if (!cur) return null
  const many = images.length > 1

  return createPortal(
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <button className={styles.close} onClick={onClose} title="Close (Esc)"><X size={20} /></button>

      {many && (
        <button className={`${styles.nav} ${styles.navLeft}`} onClick={e => { e.stopPropagation(); go(-1) }} title="Previous (←)">
          <ChevronLeft size={26} />
        </button>
      )}

      <div className={styles.stage} onClick={e => e.stopPropagation()}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.img
            key={cur.url}
            src={cur.url}
            alt={cur.label ?? ''}
            className={styles.image}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            draggable={false}
          />
        </AnimatePresence>

        {(cur.label || cur.badge || many) && (
          <div className={styles.caption} onClick={e => e.stopPropagation()}>
            {cur.badge}
            {cur.label && <span className={styles.captionLabel}>{cur.label}</span>}
            {cur.caption && <span className={styles.captionSub}>{cur.caption}</span>}
            {many && <span className={styles.counter}>{i + 1} / {images.length}</span>}
          </div>
        )}
      </div>

      {many && (
        <button className={`${styles.nav} ${styles.navRight}`} onClick={e => { e.stopPropagation(); go(1) }} title="Next (→)">
          <ChevronRight size={26} />
        </button>
      )}
    </motion.div>,
    document.body,
  )
}
