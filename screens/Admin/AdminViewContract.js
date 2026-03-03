import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  LayoutAnimation,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from "react-native";
import Header from "../../components/Header";
import styles from "../../styles/ContractScreenStyles";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";

const API_BASE = "https://backend-arriendos-v2-production.up.railway.app";

export default function AdminViewContract({ navigation, route }) {
  const { id } = route?.params || {};
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const fontSizeTitle = isWeb ? 40 : screenWidth * 0.12;

  const [expandedFormat, setExpandedFormat] = useState(false);
  const [expandedLegal, setExpandedLegal] = useState(false);
  const [expandedRuc, setExpandedRuc] = useState(false);
  const [expandedSri, setExpandedSri] = useState(false);

  const [selectedRuc, setSelectedRuc] = useState(null);

  const [arriendo, setArriendo] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchArriendo = async () => {
      try {
        const response = await axios.get(
          `https://backend-arriendos-v2-production.up.railway.app/api/auth/rentals/${id}`
        );
        console.log(" DATOS RECIBIDOS DE ARRIENDO:", response.data);
      } catch (error) {
        console.error("Error al obtener datos del arriendo:", error);
      }
    };
    if (id) fetchArriendo();
  }, [id]);

  // -------- DESCARGAR PLANTILLA --------
  const downloadTemplate = () => {
    const url = "https://backend-arriendos-v2-production.up.railway.app/api/arriendos/template";
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "No se pudo abrir la plantilla.")
    );
  };

  // -------- SUBIR CONTRATO FIRMADO --------
  const uploadContract = async () => {
    try {
      if (!id) return Alert.alert("Error", "Arriendo no válido.");

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      });

      if (!result || result.type === "cancel") return;

      const file = result?.assets?.[0] || result;

      const formData = new FormData();
      formData.append("contrato", {
        uri: file.uri,
        name: file.name || `contrato_${Date.now()}.docx`,
        type: file.mimeType || "application/octet-stream",
      });

      setUploading(true);

      const res = await fetch(`${API_BASE}/api/arriendos/${id}/contrato`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.ok) {
        Alert.alert("Éxito", "Contrato subido correctamente.");
        const response = await axios.get(`${API_BASE}/api/arriendos/${id}`);
        setArriendo(response?.data?.data || response?.data);
      } else {
        Alert.alert("Error", json.message || "Fallo al subir contrato.");
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo subir el archivo.");
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  // -------- VER CONTRATO --------
  const viewContract = () => {
    if (!arriendo?.contrato_archivo)
      return Alert.alert("Sin archivo", "No hay contrato subido.");

    Linking.openURL(arriendo.contrato_archivo);
  };

  // -------- ENVIAR POR CORREO --------
  const sendEmail = () => {
    const email =
      arriendo?.email_estudiante ||
      arriendo?.estudiante_email ||
      arriendo?.email;

    if (!email) return Alert.alert("Error", "No hay correo del estudiante.");

    const link = arriendo?.contrato_archivo || "Contrato aún no disponible";

    const mailto = `mailto:${email}?subject=Contrato de Arriendo&body=Adjunto el contrato firmado.\n\nEnlace: ${link}`;
    Linking.openURL(mailto).catch(() =>
      Alert.alert("Error", "No se pudo abrir el correo.")
    );
  };

  // ------ RUC LOGIC ------
  const onSelectRuc = (value) => {
    setSelectedRuc(value);

    if (value === "No") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedSri(true);
    }
  };

  if (loading) {
    return (
      <View style={localStyles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  console.log("🔎 ID RECIBIDO EN AdminViewContract:", id);
  console.log("📌 DATOS RECIBIDOS DE ARRIENDO:", arriendo);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
      keyboardVerticalOffset={100}
    >
      <View style={isWeb ? styles.webContainer : styles.flex}>
        <ScrollView
          style={isWeb ? styles.webScrollView : styles.flex}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.container}>
            <Header isLoggedIn={true} />

            <Text style={[styles.title, { fontSize: fontSizeTitle }]}>
              Proceso de legalización de contratos
            </Text>

            <Image
              source={require("../../assets/contract-icon.png")}
              style={styles.icon}
            />

            <View style={[styles.form, { width: inputWidth }]}>
              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setExpandedFormat(!expandedFormat)}
                >
                  <Text style={styles.accordionTitle}>
                    Modelo de formato de contrato
                  </Text>
                  <Ionicons
                    name={expandedFormat ? "chevron-up" : "chevron-down"}
                    size={20}
                  />
                </TouchableOpacity>

                {expandedFormat && (
                  <View style={styles.accordionContent}>
                    <TouchableOpacity
                      style={localStyles.optionBtn}
                      onPress={downloadTemplate}
                    >
                      <Text style={localStyles.optionText}>
                        📄 Descargar documento
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setExpandedLegal(!expandedLegal)}
                >
                  <Text style={styles.accordionTitle}>
                    Pasos para legalizar el contrato en Riobamba
                  </Text>
                  <Ionicons
                    name={expandedLegal ? "chevron-up" : "chevron-down"}
                    size={20}
                  />
                </TouchableOpacity>

                {expandedLegal && (
                  <View style={styles.accordionContent}>
                    <Text style={{ marginBottom: 8 }}>
                      Para legalizar un contrato en Riobamba debes acudir al
                      Municipio y registrar el documento debidamente firmado.
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(
                          "https://www.gadmriobamba.gob.ec" // enlace OFICIAL municipio Riobamba
                        )
                      }
                    >
                      <Text style={{ color: "blue" }}>
                        🌐 Ver información oficial del Municipio
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setExpandedRuc(!expandedRuc)}
                >
                  <Text style={styles.accordionTitle}>¿Cuenta con RUC?</Text>
                  <Ionicons
                    name={expandedRuc ? "chevron-up" : "chevron-down"}
                    size={20}
                  />
                </TouchableOpacity>

                {expandedRuc && (
                  <View style={styles.accordionContent}>
                    <TouchableOpacity
                      style={[
                        localStyles.optionBtn,
                        selectedRuc === "Sí" && localStyles.selected,
                      ]}
                      onPress={() => onSelectRuc("Sí")}
                    >
                      <Text
                        style={[
                          localStyles.optionText,
                          selectedRuc === "Sí" && localStyles.selectedText,
                        ]}
                      >
                        Sí
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        localStyles.optionBtn,
                        selectedRuc === "No" && localStyles.selected,
                      ]}
                      onPress={() => onSelectRuc("No")}
                    >
                      <Text
                        style={[
                          localStyles.optionText,
                          selectedRuc === "No" && localStyles.selectedText,
                        ]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>

                    {selectedRuc === "Sí" && (
                      <Text style={{ marginTop: 8 }}>
                        ✔ Puedes continuar con el proceso de contrato.
                      </Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.accordionContainer}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setExpandedSri(!expandedSri)}
                >
                  <Text style={styles.accordionTitle}>
                    Requisitos SRI obtención de RUC
                  </Text>
                  <Ionicons
                    name={expandedSri ? "chevron-up" : "chevron-down"}
                    size={20}
                  />
                </TouchableOpacity>

                {expandedSri && (
                  <View style={styles.accordionContent}>
                    <Text style={{ marginBottom: 8 }}>
                      Para obtener el RUC debes acercarte al SRI con tu cédula y
                      cumplir los requisitos establecidos.
                    </Text>

                    <TouchableOpacity
                      onPress={
                        () => Linking.openURL("https://www.sri.gob.ec") // enlace oficial SRI Ecuador
                      }
                    >
                      <Text style={{ color: "blue" }}>
                        🌐 Ver requisitos oficiales del SRI
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {arriendo && (
                <>
                  <View style={{ marginTop: 15 }}>
                    <Text style={{ fontWeight: "700" }}>Propiedad:</Text>
                    <Text>{arriendo.propiedad_titulo}</Text>

                    <Text style={{ fontWeight: "700", marginTop: 8 }}>
                      Estudiante:
                    </Text>
                    <Text>
                      {arriendo.nombres} {arriendo.apellidos}
                    </Text>

                    <Text style={{ fontWeight: "700", marginTop: 8 }}>
                      Estado solicitud:
                    </Text>
                    <Text>{arriendo.estado}</Text>
                  </View>

                  <View style={{ marginTop: 15 }}>
                    <Text style={{ fontWeight: "700" }}>Contrato actual:</Text>
                    {arriendo.contrato_archivo ? (
                      <TouchableOpacity onPress={viewContract}>
                        <Text style={{ color: "blue", marginTop: 5 }}>
                          📄 Ver / Descargar contrato subido
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={{ marginTop: 5 }}>
                        ❌ No hay contrato subido todavía
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      localStyles.actionButton,
                      { backgroundColor: "#0d6efd" },
                    ]}
                    onPress={uploadContract}
                    disabled={uploading}
                  >
                    <Text style={localStyles.actionText}>
                      {uploading ? "Subiendo..." : "📤 Subir contrato firmado"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      localStyles.actionButton,
                      { backgroundColor: "#6f42c1" },
                    ]}
                    onPress={sendEmail}
                  >
                    <Text style={localStyles.actionText}>
                      📧 Enviar contrato por correo
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.button, styles.back, { marginTop: 20 }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.buttonText}>Atrás</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  optionBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginBottom: 10,
  },
  optionText: { fontSize: 15 },
  selected: { backgroundColor: "#0d6efd" },
  selectedText: { color: "#fff", fontWeight: "700" },
  actionButton: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
});
