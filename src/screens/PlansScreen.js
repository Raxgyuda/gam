import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: '$0',
    period: 'siempre',
    color: '#4a9eff',
    features: [
      '20 mensajes por dia',
      '3 personajes disponibles',
      'Historial de chat',
    ],
    locked: [
      'Personajes Pro y Premium',
      'Mensajes ilimitados',
      'Crear personajes',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$4.99',
    period: 'por mes',
    color: '#00ffb4',
    popular: true,
    features: [
      'Mensajes ilimitados',
      'Todos los personajes Free y Pro',
      'Historial completo',
      'Prioridad de respuesta',
    ],
    locked: [
      'Personajes Premium',
      'Crear personajes propios',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: 'por mes',
    color: '#ff4aff',
    features: [
      'Todo lo de Pro',
      'TODOS los personajes',
      'Crear personajes propios',
      'Personajes exclusivos nuevos',
      'Soporte prioritario',
    ],
    locked: [],
  },
];

export default function PlansScreen({ navigation }) {
  const { plan, upgradePlan } = useApp();

  function handleSelect(selectedPlan) {
    if (selectedPlan === plan) return;
    if (selectedPlan === 'free') {
      Alert.alert('Bajar plan', 'Volveras al plan gratuito.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => { upgradePlan('free'); navigation.goBack(); } },
      ]);
      return;
    }
    // TODO: Integrar Stripe aqui
    Alert.alert(
      'Proximamente',
      `El plan ${selectedPlan.toUpperCase()} estara disponible pronto con pagos via Stripe.\n\nPor ahora lo activamos de prueba.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Activar prueba', onPress: () => {
            upgradePlan(selectedPlan);
            navigation.goBack();
          }
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Planes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headline}>Desbloquea todo el potencial</Text>
        <Text style={styles.subheadline}>Elige el plan que mejor se adapte a ti</Text>

        {PLANS.map(p => {
          const isActive = plan === p.id;
          return (
            <View key={p.id} style={[styles.card, { borderColor: p.color + (isActive ? 'aa' : '33') }, p.popular && styles.popularCard]}>
              {p.popular && (
                <View style={[styles.popularBadge, { backgroundColor: p.color }]}>
                  <Text style={styles.popularText}>MAS POPULAR</Text>
                </View>
              )}

              {isActive && (
                <View style={[styles.activeBadge, { backgroundColor: p.color + '22', borderColor: p.color + '66' }]}>
                  <Text style={[styles.activeText, { color: p.color }]}>PLAN ACTUAL</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: p.color }]}>{p.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: p.color }]}>{p.price}</Text>
                  <Text style={styles.period}>/{p.period}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {p.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={[styles.checkIcon, { color: p.color }]}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}

              {p.locked.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.lockIcon}>✗</Text>
                  <Text style={styles.lockedText}>{f}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.selectBtn, { backgroundColor: isActive ? p.color + '22' : p.color, borderColor: p.color }]}
                onPress={() => handleSelect(p.id)}
              >
                <Text style={[styles.selectText, { color: isActive ? p.color : '#000' }]}>
                  {isActive ? 'Plan actual' : `Elegir ${p.name}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={styles.footer}>Cancela cuando quieras · Pagos seguros via Stripe</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060a10' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { padding: 4, width: 40 },
  backIcon: { fontSize: 22, color: 'white' },
  title: { fontSize: 18, fontWeight: '800', color: 'white' },
  scroll: { padding: 20, paddingBottom: 40 },
  headline: { fontSize: 24, fontWeight: '800', color: 'white', textAlign: 'center', marginBottom: 8 },
  subheadline: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 28 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 16, position: 'relative' },
  popularCard: { backgroundColor: 'rgba(0,255,180,0.03)' },
  popularBadge: { position: 'absolute', top: -12, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12 },
  popularText: { fontSize: 10, fontWeight: '800', color: '#000', letterSpacing: 1 },
  activeBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12 },
  activeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  planName: { fontSize: 22, fontWeight: '800' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { fontSize: 28, fontWeight: '800' },
  period: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  checkIcon: { fontSize: 14, fontWeight: '800', width: 16 },
  lockIcon: { fontSize: 12, color: 'rgba(255,255,255,0.2)', width: 16 },
  featureText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  lockedText: { fontSize: 13, color: 'rgba(255,255,255,0.25)' },
  selectBtn: { marginTop: 16, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  selectText: { fontSize: 15, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 },
});
