import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { CHARACTERS, CATEGORIES } from '../data/characters';

export default function HomeScreen({ navigation }) {
  const { plan, getRemainingMessages, canAccessCharacter, favorites, toggleFavorite } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = CHARACTERS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'all' || c.category === activeCategory;
    return matchSearch && matchCat;
  });

  const planColors = { free: '#4a9eff', pro: '#00ffb4', premium: '#ff4aff' };
  const planLabels = { free: 'GRATIS', pro: 'PRO', premium: 'PREMIUM' };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#060a10" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>RolePlay AI</Text>
          <Text style={styles.subtitle}>Elige tu personaje</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.planBadge, { borderColor: planColors[plan] }]}
            onPress={() => navigation.navigate('Plans')}
          >
            <Text style={[styles.planText, { color: planColors[plan] }]}>{planLabels[plan]}</Text>
          </TouchableOpacity>
          {plan === 'free' && (
            <Text style={styles.msgCount}>{getRemainingMessages()} msgs</Text>
          )}
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar personaje..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* CATEGORIES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catBtn, activeCategory === cat.id && styles.catBtnActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CHARACTERS GRID */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
        {filtered.map(char => {
          const locked = !canAccessCharacter(char.tier);
          const isFav = favorites.includes(char.id);
          return (
            <TouchableOpacity
              key={char.id}
              style={[styles.card, { borderColor: char.color + '44' }]}
              onPress={() => {
                if (locked) navigation.navigate('Plans');
                else navigation.navigate('Chat', { character: char });
              }}
              activeOpacity={0.8}
            >
              {/* Background gradient effect */}
              <View style={[styles.cardBg, { backgroundColor: char.gradient[1] + '88' }]} />

              {/* Lock overlay */}
              {locked && (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.lockText}>{char.tier.toUpperCase()}</Text>
                </View>
              )}

              {/* Tier badge */}
              {char.tier !== 'free' && (
                <View style={[styles.tierBadge, { backgroundColor: char.color + '33', borderColor: char.color + '66' }]}>
                  <Text style={[styles.tierText, { color: char.color }]}>{char.tier.toUpperCase()}</Text>
                </View>
              )}

              {/* Favorite */}
              <TouchableOpacity
                style={styles.favBtn}
                onPress={() => toggleFavorite(char.id)}
              >
                <Text style={{ fontSize: 16 }}>{isFav ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>

              {/* Content */}
              <Text style={styles.charEmoji}>{char.emoji}</Text>
              <Text style={[styles.charName, { color: char.color }]}>{char.name}</Text>
              <Text style={styles.charTitle}>{char.title}</Text>
              <Text style={styles.charDesc} numberOfLines={2}>{char.description}</Text>

              {/* Chat button */}
              {!locked && (
                <View style={[styles.chatBtn, { backgroundColor: char.color + '22', borderColor: char.color + '55' }]}>
                  <Text style={[styles.chatBtnText, { color: char.color }]}>Chatear →</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, { color: '#4a9eff' }]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Plans')}>
          <Text style={styles.navIcon}>⭐</Text>
          <Text style={styles.navLabel}>Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>❤️</Text>
          <Text style={styles.navLabel}>Favoritos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060a10' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: 'white', letterSpacing: 1 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  planBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  planText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  msgCount: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: 'white', fontSize: 14 },
  categories: { paddingLeft: 20, marginBottom: 16, flexGrow: 0 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  catBtnActive: { backgroundColor: 'rgba(74,158,255,0.15)', borderColor: 'rgba(74,158,255,0.4)' },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  catLabelActive: { color: '#4a9eff' },
  scroll: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 80, gap: 12 },
  card: { width: '47%', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderRadius: 16, padding: 16, overflow: 'hidden', position: 'relative' },
  cardBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  lockIcon: { fontSize: 28, marginBottom: 6 },
  lockText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1 },
  tierBadge: { position: 'absolute', top: 10, left: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, zIndex: 5 },
  tierText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  favBtn: { position: 'absolute', top: 10, right: 10, zIndex: 5 },
  charEmoji: { fontSize: 36, marginBottom: 8, marginTop: 16 },
  charName: { fontSize: 16, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  charTitle: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: 0.5 },
  charDesc: { fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 16, marginBottom: 12 },
  chatBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 6, alignItems: 'center' },
  chatBtnText: { fontSize: 12, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: '#060a10', paddingBottom: 20 },
  navItem: { flex: 1, alignItems: 'center', paddingTop: 12, gap: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
});
