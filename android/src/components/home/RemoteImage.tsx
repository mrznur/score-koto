import React, { useState } from 'react';
import { Image } from 'react-native';
import TeamBadge from '../ui/TeamBadge';

export default function RemoteImage({
  uri, size, fallbackTeam,
}: { uri?: string | null; size: number; fallbackTeam: string }) {
  const [error, setError] = useState(false);
  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setError(true)}
      />
    );
  }
  return <TeamBadge team={fallbackTeam} small={size < 30} />;
}