import * as React from 'react'

export const useIsMounted = () => {
  const [isMounted, setIsMounted] = React.useState(false)
  const isMountedRef = React.useRef(false)

  React.useEffect(() => {
    isMountedRef.current = true
    setIsMounted(true)

    return () => {
      isMountedRef.current = false
      setIsMounted(false)
    }
  }, [])

  return { current: isMounted }
}
