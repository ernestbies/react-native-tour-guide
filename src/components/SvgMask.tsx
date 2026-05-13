import React, { Component } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScaledSize,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Svg from 'react-native-svg';
import { IStep, ValueXY } from '../types';
import { AnimatedSvgPath } from './AnimatedPath';

interface Props {
  size: ValueXY;
  position: ValueXY;
  style: StyleProp<ViewStyle>;
  animationDuration?: number;
  backdropColor: string;
  dismissOnPress?: boolean;
  maskOffset?: number;
  borderRadius?: number;
  currentStep?: IStep;
  easing: (value: number) => number;
  stop: () => void;
}

interface State {
  size: ValueXY;
  position: ValueXY;
  opacity: Animated.Value;
  animation: Animated.Value;
  canvasSize: ValueXY;
  previousPath: string;
}

const IS_WEB = Platform.OS !== 'web';

interface RectMask {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

const parseRectPath = (path: string): RectMask | null => {
  const hole = path.replace(/^M0,0H[\d.]*V[\d.]*H0V0Z\s*/, '').trim();
  const simple = hole.match(/^M(-?[\d.]+),(-?[\d.]+)H(-?[\d.]+)V(-?[\d.]+)H-?[\d.]+V-?[\d.]+Z$/);

  if (simple) {
    const x = parseFloat(simple[1]);
    const y = parseFloat(simple[2]);
    const x2 = parseFloat(simple[3]);
    const y2 = parseFloat(simple[4]);
    return { x, y, w: x2 - x, h: y2 - y, r: 0 };
  }

  const rounded = hole.match(/^M(-?[\d.]+),(-?[\d.]+)H(-?[\d.]+)\s*a([\d.]+)/);

  if (rounded) {
    const x = parseFloat(rounded[1]);
    const y = parseFloat(rounded[2]);
    const x2 = parseFloat(rounded[3]);
    const r = parseFloat(rounded[4]);
    const vMatch = hole.match(/V(-?[\d.]+)/);
    const bottom = vMatch ? parseFloat(vMatch[1]) + r : y;

    return { x, y, w: x2 - x, h: bottom - y, r };
  }

  const fallback = hole.match(/M(-?[\d.]+),(-?[\d.]+)/);
  if (fallback) {
    return {
      x: parseFloat(fallback[1]),
      y: parseFloat(fallback[2]),
      w: 1,
      h: 1,
      r: 0,
    };
  }

  return null;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const round = (value: number) => Math.round(value * 100) / 100;

const buildRectPath = (
  canvasW: number,
  canvasH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const rx = round(x);
  const ry = round(y);
  const rw = round(w);
  const rh = round(h);
  const rr = round(r);
  const x2 = round(rx + rw);
  const y2 = round(ry + rh);

  if (r > 0) {
    const radius = Math.min(rr, rw / 2, rh / 2);
    return `M0,0H${canvasW}V${canvasH}H0V0ZM${rx},${ry}H${x2} a${radius},${radius} 0 0 1 ${radius},${radius}V${round(
      y2 - radius
    )} a${radius},${radius} 0 0 1 -${radius},${radius}H${rx} a${radius},${radius} 0 0 1 -${radius},-${radius}V${round(
      ry + radius
    )} a${radius},${radius} 0 0 1 ${radius},-${radius}Z`;
  }

  return `M0,0H${canvasW}V${canvasH}H0V0ZM${rx},${ry}H${x2}V${y2}H${rx}V${ry}Z`;
};

const lerpMaskPath = (
  previousPath: string,
  t: number,
  canvasW: number,
  canvasH: number,
  toX: number,
  toY: number,
  toW: number,
  toH: number,
  toR: number,
  fromRect?: RectMask | null
) => {
  const from = fromRect || parseRectPath(previousPath);

  if (!from || t >= 1) {
    return buildRectPath(canvasW, canvasH, toX, toY, toW, toH, toR);
  }
  if (t <= 0) {
    return previousPath;
  }

  return buildRectPath(
    canvasW,
    canvasH,
    lerp(from.x, toX, t),
    lerp(from.y, toY, t),
    lerp(from.w, toW, t),
    lerp(from.h, toH, t),
    lerp(from.r, toR, t)
  );
};

export class SvgMask extends Component<Props, State> {
  static defaultProps = {
    easing: Easing.linear,
    size: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    maskOffset: 0,
  };

  listenerID: string;
  rafID: number;
  pendingPath?: string;
  mask = React.createRef<any>();

  windowDimensions: ScaledSize | null = null;
  firstPath: string | undefined;
  animationFromRect?: RectMask | null;

  constructor(props: Props) {
    super(props);

    this.windowDimensions = Platform.select({
      android: Dimensions.get('screen'),
      default: Dimensions.get('window'),
    });

    this.firstPath = `M0,0H${this.windowDimensions.width}V${
      this.windowDimensions.height
    }H0V0ZM${this.windowDimensions.width / 2},${this.windowDimensions.height / 2} h 1 v 1 h -1 Z`;

    this.state = {
      canvasSize: {
        x: this.windowDimensions.width,
        y: this.windowDimensions.height,
      },
      size: props.size,
      position: props.position,
      opacity: new Animated.Value(0),
      animation: new Animated.Value(0),
      previousPath: this.firstPath,
    };

    this.listenerID = this.state.animation.addListener(this.animationListener);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.position !== this.props.position || prevProps.size !== this.props.size) {
      this.animate();
    }
  }

  componentWillUnmount() {
    if (this.listenerID) {
      this.state.animation.removeListener(this.listenerID);
    }
    if (this.rafID) {
      cancelAnimationFrame(this.rafID);
    }
  }

  getPath = () => {
    const { previousPath, animation, canvasSize } = this.state;
    const { size, position, currentStep, maskOffset, borderRadius } = this.props;
    const mo = currentStep?.maskOffset || maskOffset || 0;
    const br = currentStep?.borderRadius || borderRadius || 0;
    const t = (animation as any)._value;

    return lerpMaskPath(
      previousPath,
      t,
      canvasSize.x,
      canvasSize.y,
      position.x - mo / 2,
      position.y - mo / 2,
      size.x + mo,
      size.y + mo,
      br,
      this.animationFromRect
    );
  };

  animationListener = () => {
    this.pendingPath = this.getPath();
    if (this.rafID) {
      return;
    }

    this.rafID = requestAnimationFrame(() => {
      const d = this.pendingPath;
      this.rafID = 0;
      if (this.mask && this.mask.current) {
        if (IS_WEB) {
          // @ts-ignore
          this.mask.current.setNativeProps({ d });
        } else {
          // @ts-ignore
          this.mask.current._touchableNode.setAttribute('d', d);
        }
      }
    });
  };

  animate = () => {
    this.animationFromRect = parseRectPath(this.state.previousPath);
    const isFirstAppearance =
      this.state.previousPath === this.firstPath && (this.state.opacity as any)._value === 0;

    if (isFirstAppearance) {
      this.state.animation.setValue(1);
      const targetPath = this.getPath();

      this.setState({ previousPath: targetPath }, () => {
        this.animationFromRect = parseRectPath(targetPath);
        this.state.animation.setValue(0);
        Animated.timing(this.state.opacity, {
          toValue: 1,
          duration: this.props.animationDuration,
          easing: this.props.easing,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    const animations = [
      Animated.timing(this.state.animation, {
        toValue: 1,
        duration: this.props.animationDuration,
        easing: this.props.easing,
        useNativeDriver: false,
      }),
    ];
    if ((this.state.opacity as any)._value !== 1) {
      animations.push(
        Animated.timing(this.state.opacity, {
          toValue: 1,
          duration: this.props.animationDuration,
          easing: this.props.easing,
          useNativeDriver: true,
        })
      );
    }
    Animated.parallel(animations, { stopTogether: false }).start((result) => {
      if (result.finished) {
        const nextPath = this.getPath();

        this.setState({ previousPath: nextPath }, () => {
          this.animationFromRect = parseRectPath(nextPath);
          if ((this.state.animation as any)._value === 1) {
            this.state.animation.setValue(0);
          }
        });
      }
    });
  };

  componentDidMount() {
    if (
      this.props.size &&
      this.props.position &&
      (this.props.size.x !== 0 || this.props.size.y !== 0)
    ) {
      this.animate();
    }
  }

  handleLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }: LayoutChangeEvent) => {
    this.setState({
      canvasSize: {
        x: width,
        y: height,
      },
    });
  };

  render() {
    if (!this.state.canvasSize) {
      return null;
    }
    const { dismissOnPress, stop } = this.props;

    return (
      <Pressable
        style={this.props.style}
        onLayout={this.handleLayout}
        pointerEvents={dismissOnPress ? 'box-only' : 'none'}
        onPress={dismissOnPress ? stop : undefined}
      >
        <Animated.View style={{ opacity: this.state.opacity }}>
          <Svg
            pointerEvents="none"
            width={this.state.canvasSize.x}
            height={this.state.canvasSize.y}
          >
            <AnimatedSvgPath
              ref={this.mask}
              fill={this.props.backdropColor}
              strokeWidth={0}
              fillRule="evenodd"
              d={this.firstPath}
            />
          </Svg>
        </Animated.View>
      </Pressable>
    );
  }
}
