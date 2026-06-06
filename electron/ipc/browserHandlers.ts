import type { IpcMain } from 'electron'
import { PlaywrightService } from '../services/playwrightService'

export function registerBrowserHandlers(ipcMain: IpcMain) {
  ipcMain.handle('browser:status',  () => PlaywrightService.getStatus())
  ipcMain.handle('browser:install', async () => {
    await PlaywrightService.install()
    // Re-resolve PLEX_BROWSER_EXEC now that the binary exists
    PlaywrightService.setupEnv()
  })
}
