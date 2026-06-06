import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';

export default function ProductDetailScreen() {
  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: '/assets/prod-ghe.jpg' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>Ghẹ Xanh Size 3</Text>
        <Text style={styles.price}>280.000đ</Text>
        <Text style={styles.desc}>Ghẹ xanh được đánh bắt trực tiếp tại vùng biển Phan Thiết.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 300 },
  info: { padding: 16 },
  name: { fontSize: 20, fontWeight: '700' },
  price: { fontSize: 24, fontWeight: '800', color: '#ff2b2b', marginTop: 8 },
  desc: { marginTop: 12, lineHeight: 22, color: '#475569' },
});
