import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FollowType = 'team' | 'player' | 'competition';

export interface FollowedItem {
  id: string;
  type: FollowType;
  name: string;
  subtitle?: string;
  logoUrl?: string | null;
}

const KEY = 'following_v1';

export function useFollowing() {
  const [items, setItems] = useState<FollowedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => { if (raw) setItems(JSON.parse(raw)); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback(async (next: FollowedItem[]) => {
    setItems(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const follow = useCallback((item: FollowedItem) => {
    setItems(prev => {
      if (prev.some(i => i.id === item.id && i.type === item.type)) return prev;
      const next = [...prev, item];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const unfollow = useCallback((id: string, type: FollowType) => {
    setItems(prev => {
      const next = prev.filter(i => !(i.id === id && i.type === type));
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFollowing = useCallback((id: string, type: FollowType) => {
    return items.some(i => i.id === id && i.type === type);
  }, [items]);

  const reload = useCallback(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => { if (raw) setItems(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  return { items, loaded, follow, unfollow, isFollowing, reload };
}
