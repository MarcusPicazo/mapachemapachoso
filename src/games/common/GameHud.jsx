import { useEffect } from 'react'

// Reporta el estado del HUD hacia GameStage, que lo renderiza como HTML
// normal FUERA del Canvas (ver GameHudOverlay). No usar drei <Html> para
// HUD fijo: su anclaje 3D puede proyectar fuera de pantalla segun camara.
export function usePillHud(onHud, pills, message, messageTone = 'gold') {
  const key = JSON.stringify(pills) + '|' + message + '|' + messageTone
  useEffect(() => {
    if (onHud) onHud({ pills, message, messageTone })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, onHud])
}
