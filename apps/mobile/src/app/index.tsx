import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>HẢI SẢN TƯƠI SỐNG</Text>
        <Text style={styles.heroSub}>GIAO NHANH TRONG NGÀY</Text>
        <Link href="/products" style={styles.cta}>MUA NGAY</Link>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DANH MỤC</Text>
        <View style={styles.grid}>
          {['Tôm', 'Cua', 'Cá', 'Mực', 'Ốc', 'Combo'].map(cat => (
            <Link key={cat} href={`/products?category=${cat.toLowerCase()}`} style={styles.catItem}>
              <Text>{cat}</Text>
            </Link>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbff' },
  hero: { padding: 24, alignItems: 'center', backgroundColor: '#005bdc' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 16, color: '#dceeff', marginTop: 4 },
  cta: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#fff', borderRadius: 8, color: '#005bdc', fontWeight: '700' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: { padding: 12, backgroundColor: '#fff', borderRadius: 8, minWidth: '30%', alignItems: 'center' },
});
