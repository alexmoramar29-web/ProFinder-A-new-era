import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ChatIndividualScreen() {
  return (
    <View style={styles.centro}>
      <Text style={styles.texto}>Chat con cliente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFC' },
  texto: { fontSize: 18, color: '#5c4b8a', fontWeight: 'bold' }
});