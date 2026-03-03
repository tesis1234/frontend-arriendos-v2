import React from "react";
import { Modal, View, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ModalWrapper({ visible, onClose, children }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Caja del modal */}
        <View style={styles.modal}>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          {/* ✅ Scroll SOLO dentro del modal */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
  },
  modal: {
    width: "92%",
    maxWidth: 520,

    // ✅ altura controlada para que SIEMPRE haya scroll si hace falta
    maxHeight: Platform.OS === "web" ? "85vh" : "85%",

    backgroundColor: "#fff",
    borderRadius: 16,
    paddingTop: 18, // deja espacio arriba para el close
    paddingHorizontal: 16,
    paddingBottom: 14,
    elevation: 10,
  },
  close: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 10,
  },
  scroll: {
    width: "100%",
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
});
