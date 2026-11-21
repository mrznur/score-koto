import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAppColors } from '../../hooks/useAppColors';
import { FeaturedItem } from '../../utils/featured';
import FeaturedCard from './FeaturedCard';

export default function FeaturedCarousel({
  featured, cardWidth, onOpenMatch,
}: {
  featured: FeaturedItem[];
  cardWidth: number;
  onOpenMatch: (matchId: string) => void;
}) {
  const { colors } = useAppColors();
  const [carouselIndex, setCarouselIndex] = useState(0);

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={e =>
          setCarouselIndex(Math.round(e.nativeEvent.contentOffset.x / cardWidth))
        }
      >
        {featured.map(item => (
          <FeaturedCard
            key={item.match.id}
            item={item}
            width={cardWidth}
            onPress={() => onOpenMatch(item.match.id)}
          />
        ))}
      </ScrollView>
      {featured.length > 1 && (
        <View style={styles.dots}>
          {featured.map((f, i) => (
            <View
              key={f.match.id}
              style={[
                styles.dot,
                { backgroundColor: i === carouselIndex ? Colors.primary : colors.line },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});