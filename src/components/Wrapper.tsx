import * as React from 'react'
import { View, StyleProp, ViewStyle } from 'react-native'

interface WrapperProps {
  copilot?: any
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export const Wrapper = React.forwardRef<View, WrapperProps>(
  ({ copilot, children, style }, forwardedRef) => {
    const setRef = React.useCallback(
      (node: View | null) => {
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          forwardedRef.current = node
        }

        if (copilot?.ref) {
          if (typeof copilot.ref === 'function') {
            copilot.ref(node)
          } else {
            copilot.ref.current = node
          }
        }
      },
      [forwardedRef, copilot],
    )

    return (
      <View style={style} ref={setRef} onLayout={copilot?.onLayout}>
        {children}
      </View>
    )
  },
)
