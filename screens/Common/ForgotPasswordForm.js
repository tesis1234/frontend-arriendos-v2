import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import styles from "../../styles/ForgotPasswordScreenStyles";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    if (!email) {
      alert("Ingrese su correo");
      return;
    }

    const response = await fetch(
      "https://backend-arriendos-v2-production.up.railway.app/api/auth/reset-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();
    alert(data.message || "Correo enviado");
  };

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Recuperar contraseña</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.register} onPress={handleReset}>
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}
