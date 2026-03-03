import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Image,
} from "react-native";
import Header from "../../components/Header";
import styles from "../../styles/ForgotPasswordScreenStyles";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.9, 400) : "100%";

  const validateEmail = () => {
    if (!email) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico.");
      return false;
    }
    return true;
  };

  const buildResetPayload = () => {
    return JSON.stringify({ email });
  };

  const sendResetRequest = async (payload) => {
    const response = await fetch(
      "https://backend-arriendos-v2-production.up.railway.app/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }
    );
    return await response.json();
  };

  const handlePasswordReset = async () => {
    try {
      if (!validateEmail()) return;

      const payload = buildResetPayload();
      const data = await sendResetRequest(payload);

      if (data.success) {
        Alert.alert("Éxito", data.message || "Correo enviado correctamente");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.message || "No se pudo enviar el correo");
      }
    } catch (error) {
      Alert.alert("Error", "Error al conectar con el servidor");
    }
  };


  return (

    <View style={styles.container}>
      {/* ENCABEZADO */}
      <View style={{
        height: 70,
        width: "100%",
        flexDirection: "row"
      }}>
        <View style={{ flex: 1, backgroundColor: "#B80000" }} />
        <View style={{ flex: 1, backgroundColor: "#ffffff" }} />
        <View style={{ flex: 1, backgroundColor: "#006400" }} />
      </View>
      <Header navigation={navigation} isLoggedIn={false} />

      <View style={styles.content}>
        <Image
          source={require("../../assets/recovery-icon.png")}
          style={styles.icon}
        />
        <View style={{ width: inputWidth }}>
          <Text style={styles.label}>Correo electrónico:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu correo"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.back]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Atrás</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.register]}
            onPress={handlePasswordReset}
          >
            <Text style={styles.buttonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
