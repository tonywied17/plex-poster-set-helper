import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { useAppContext } from '../../app/AppContext'
import styles from './StatusBar.module.css'

export default function StatusBar() {
  const { plexConnected, navigate } = useAppContext()
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.api.app.getVersion().then(setVersion)
  }, [])

  const dotClass = styles[plexConnected ? 'dotOn' : 'dotOff']
  const label    = plexConnected ? 'Connected to Plex' : 'Not connected to Plex'

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        {plexConnected ? (
          <>
            <span className={`${styles.dot} ${dotClass}`} />
            <span className={styles.text}>{label}</span>
          </>
        ) : (
          <button className={styles.connectBtn} onClick={() => navigate('settings')}>
            <span className={`${styles.dot} ${dotClass}`} />
            <span className={styles.text}>{label}</span>
            <Settings size={10} className={styles.settingsIcon} />
          </button>
        )}
      </div>
      <div className={styles.right}>
        {version && <span className={styles.text}>v{version}</span>}
      </div>
    </div>
  )
}
