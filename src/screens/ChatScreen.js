import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';

const API = 'http://192.168.0.111:3001/api';

export default function ChatScreen({ route, navigation }) {
  const { character } = route.params;
  const { canSendMessage, getRemainingMessages, incrementMessages, plan } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadHistory();
    // Welcome message
    setMessages([{
      id: '0',
      role: 'assistant',
      text: getWelcomeMessage(),
      ts: new Date().toISOString(),
    }]);
  }, []);

  function getWelcomeMessage() {
    const welcomes = {
      '1': '... Apareces ante mi. Habla, si tienes algo digno de decir.',
      '2': 'Detecto nueva presencia. Probabilidad de conversacion interesante: 67.3%. Comenzamos.',
      '3': 'Vaya, otro que quiere mi atencion. Mas te vale que valga la pena.',
      '4': 'Las estrellas me dijeron que llegarias hoy. Bienvenido, viajero.',
      '5': 'Identificado: civil. Protocolo de comunicacion iniciado. Di lo que necesites.',
      '6': 'Que interesante... alguien que se atreve a buscarme. Me pregunto por que.',
    };
    return welcomes[character.id] || `Hola, soy ${character.name}. ¿En que puedo ayudarte?`;
  }

  async function loadHistory() {
    try {
      const stored = await AsyncStorage.getItem(`chat_${character.id}`);
      if (stored) {
        const history = JSON.parse(stored);
        if (history.length > 0) setMessages(history);
      }
    } catch {}
  }

  async function saveHistory(msgs) {
    try {
      await AsyncStorage.setItem(`chat_${character.id}`, JSON.stringify(msgs.slice(-50)));
    } catch {}
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    if (!canSendMessage()) {
      Alert.alert(
        'Limite alcanzado',
        `Has usado tus ${20} mensajes diarios gratis.\n\nActualiza a PRO para mensajes ilimitados.`,
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Ver planes', onPress: () => navigation.navigate('Plans') },
        ]
      );
      return;
    }

    const userMsg = { id: Date.now().toString(), role: 'user', text, ts: new Date().toISOString() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    await incrementMessages();

    try {
      // Build conversation history for context
      const history = newMsgs.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          model: 'dolphin-llama3',
          systemPrompt: character.personality,
          history: history.slice(0, -1),
        }),
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.response,
        ts: new Date().toISOString(),
      };

      const finalMsgs = [...newMsgs, aiMsg];
      setMessages(finalMsgs);
      await saveHistory(finalMsgs);

    } catch (err) {
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'error',
        text: 'Error de conexion. Verifica que el servidor este corriendo.',
        ts: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    }

    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function clearChat() {
    Alert.alert('Borrar chat', '¿Borrar todo el historial con ' + character.name + '?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem(`chat_${character.id}`);
          setMessages([{ id: '0', role: 'assistant', text: getWelcomeMessage(), ts: new Date().toISOString() }]);
        }
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: character.color + '33' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.charEmoji}>{character.emoji}</Text>
          <View>
            <Text style={[styles.charName, { color: character.color }]}>{character.name}</Text>
            <Text style={styles.charTitle}>{character.title}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Text style={styles.clearIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* MESSAGES LIMIT BAR */}
      {plan === 'free' && (
        <TouchableOpacity style={styles.limitBar} onPress={() => navigation.navigate('Plans')}>
          <Text style={styles.limitText}>
            {getRemainingMessages()} mensajes gratis hoy · Toca para mejorar plan
          </Text>
          <View style={[styles.limitProgress, { width: `${(getRemainingMessages() / 20) * 100}%`, backgroundColor: character.color }]} />
        </TouchableOpacity>
      )}

      {/* MESSAGES */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[
              styles.bubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble,
              msg.role === 'error' && styles.errorBubble,
            ]}>
              {msg.role === 'assistant' && (
                <Text style={[styles.bubbleEmoji]}>{character.emoji}</Text>
              )}
              <View style={[
                styles.bubbleContent,
                msg.role === 'user' ? [styles.userContent, { backgroundColor: character.color + '22', borderColor: character.color + '44' }] : styles.aiContent,
                msg.role === 'error' && styles.errorContent,
              ]}>
                <Text style={styles.bubbleText}>{msg.text}</Text>
                <Text style={styles.bubbleTime}>
                  {new Date(msg.ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.bubble}>
              <Text style={styles.bubbleEmoji}>{character.emoji}</Text>
              <View style={[styles.bubbleContent, styles.aiContent, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={character.color} />
                <Text style={[styles.loadingText, { color: character.color }]}>escribiendo...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* INPUT */}
        <View style={[styles.inputContainer, { borderTopColor: character.color + '22' }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Habla con ${character.name}...`}
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            maxLength={500}
            onSubmitEditing={send}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? character.color : 'rgba(255,255,255,0.08)' }]}
            onPress={send}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>▶</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060a10' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: 'white' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  charEmoji: { fontSize: 32 },
  charName: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  charTitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  clearBtn: { padding: 4 },
  clearIcon: { fontSize: 18 },
  limitBar: { backgroundColor: 'rgba(255,255,255,0.04)', padding: 10, paddingHorizontal: 16, position: 'relative', overflow: 'hidden' },
  limitText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', zIndex: 1 },
  limitProgress: { position: 'absolute', bottom: 0, left: 0, height: 2, opacity: 0.6 },
  messages: { flex: 1 },
  bubble: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end', gap: 8 },
  userBubble: { flexDirection: 'row-reverse' },
  aiBubble: {},
  errorBubble: {},
  bubbleEmoji: { fontSize: 24, marginBottom: 4 },
  bubbleContent: { maxWidth: '78%', borderRadius: 16, padding: 12, borderWidth: 1 },
  userContent: { borderRadius: 16, borderTopRightRadius: 4 },
  aiContent: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', borderTopLeftRadius: 4 },
  errorContent: { backgroundColor: 'rgba(255,50,50,0.1)', borderColor: 'rgba(255,50,50,0.3)' },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  bubbleText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, textAlign: 'right' },
  loadingText: { fontSize: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, gap: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: 'white', fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: 'white', fontSize: 16 },
});
