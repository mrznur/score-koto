import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'live'
  | 'explore'
  | 'friends'
  | 'profile'
  | 'bell'
  | 'arrow'
  | 'star'
  | 'search'
  | 'calendar'
  | 'table'
  | 'spark'
  | 'send'
  | 'chevron'
  | 'sun'
  | 'settings';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 20, color = '#000000' }: IconProps) {
  const commonStroke = {
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: 'square' as const,
    strokeLinejoin: 'miter' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <>
          <Path d="M3 11.5 12 4l9 7.5" {...commonStroke} />
          <Path d="M5.5 10.5V21h13V10.5M9.5 21v-6h5v6" {...commonStroke} />
        </>
      )}
      {name === 'live' && (
        <>
          <Path d="M5 8a7 7 0 0 0 0 8M19 8a7 7 0 0 1 0 8M8 10.5a3.8 3.8 0 0 0 0 3M16 10.5a3.8 3.8 0 0 1 0 3" {...commonStroke} />
          <Circle cx={12} cy={12} r={1.6} fill={color} stroke="none" />
        </>
      )}
      {name === 'explore' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...commonStroke} />
          <Path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" {...commonStroke} />
        </>
      )}
      {name === 'friends' && (
        <>
          <Circle cx={9} cy={9} r={3} {...commonStroke} />
          <Circle cx={17} cy={10} r={2.3} {...commonStroke} />
          <Path d="M3.5 20c.4-3.3 2.2-5 5.5-5s5.1 1.7 5.5 5" {...commonStroke} />
          <Path d="M14 15.5c3.7-.6 5.8.9 6.3 3.7" {...commonStroke} />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx={12} cy={8} r={3.5} {...commonStroke} />
          <Path d="M5 21c.5-4.5 2.8-6.8 7-6.8s6.5 2.3 7 6.8" {...commonStroke} />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path d="M6 10a6 6 0 0 1 12 0v5l2 2H4l2-2v-5ZM10 20h4" {...commonStroke} />
        </>
      )}
      {name === 'arrow' && (
        <>
          <Path d="M5 12h14" {...commonStroke} />
          <Path d="M14 7l5 5-5 5" {...commonStroke} />
        </>
      )}
      {name === 'star' && (
        <>
          <Path d="m12 3 2.6 5.4 6 .8-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.8L12 3Z" {...commonStroke} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx={10.5} cy={10.5} r={6.5} {...commonStroke} />
          <Path d="m16 16 5 5" {...commonStroke} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x={3.5} y={5} width={17} height={15} {...commonStroke} />
          <Path d="M8 3v4M16 3v4M3.5 10h17" {...commonStroke} />
        </>
      )}
      {name === 'table' && (
        <>
          <Rect x={3.5} y={4} width={17} height={16} {...commonStroke} />
          <Path d="M3.5 9h17M9 4v16M15 4v16" {...commonStroke} />
        </>
      )}
      {name === 'spark' && (
        <>
          <Path d="m12 2 1.3 6.7L20 10l-6.7 1.3L12 18l-1.3-6.7L4 10l6.7-1.3L12 2Z" {...commonStroke} />
          <Path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" {...commonStroke} />
        </>
      )}
      {name === 'send' && (
        <>
          <Path d="m3 4 18 8-18 8 3-8-3-8Zm3 8h15" {...commonStroke} />
        </>
      )}
      {name === 'chevron' && (
        <>
          <Path d="m9 5 7 7-7 7" {...commonStroke} />
        </>
      )}
      {name === 'sun' && (
        <>
          <Circle cx={12} cy={12} r={3.5} {...commonStroke} />
          <Path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" {...commonStroke} />
        </>
      )}
      {name === 'settings' && (
        <>
          <Circle cx={12} cy={12} r={3} {...commonStroke} />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" {...commonStroke} />
        </>
      )}
    </Svg>
  );
}
