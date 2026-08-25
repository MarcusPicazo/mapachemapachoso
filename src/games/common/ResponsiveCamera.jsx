import { useRef, useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'

// Camara con escalado "Hor+": el fov recibido esta pensado para una pantalla
// horizontal de referencia (16:10). En pantallas mas angostas (retrato,
// celular/tablet) se amplia el fov vertical para conservar el ANCHO visible
// del tablero en vez de recortarlo, que es lo que rompe los minijuegos en
// movil. En pantallas mas anchas que la referencia se respeta el fov base.
const REFERENCE_ASPECT = 16 / 10

export default function ResponsiveCamera({ position, fov = 48, target = [0, 0, 0], maxFov = 100 }) {
  const ref = useRef(null)
  const size = useThree((s) => s.size)
  const aspect = size.width / Math.max(1, size.height)

  useLayoutEffect(() => {
    const cam = ref.current
    if (!cam) return
    let nextFov = fov
    if (aspect < REFERENCE_ASPECT) {
      const baseFovRad = (fov * Math.PI) / 180
      const horizontalFovRad = 2 * Math.atan(Math.tan(baseFovRad / 2) * REFERENCE_ASPECT)
      const verticalFovRad = 2 * Math.atan(Math.tan(horizontalFovRad / 2) / aspect)
      nextFov = Math.min(maxFov, (verticalFovRad * 180) / Math.PI)
    }
    cam.fov = nextFov
    cam.position.set(position[0], position[1], position[2])
    cam.lookAt(target[0], target[1], target[2])
    cam.updateProjectionMatrix()
    cam.updateMatrixWorld(true)
  }, [aspect, fov, maxFov, position, target])

  return <PerspectiveCamera ref={ref} makeDefault position={position} fov={fov} />
}
