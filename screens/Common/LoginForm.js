// screens/Common/LoginForm.js
import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import styles from "../../styles/LoginScreenStyles";
import { AuthContext } from "../../context/AuthContext";
import { Ionicons } from '@expo/vector-icons';

export default function LoginForm({ onGoRegister, onGoForgot }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🔑 CLAVE: usar AuthContext
  const { setUser } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Por favor completa todos los campos.");
      return;
    }

    try {
      const response = await fetch(
        "https://backend-arriendos-v2-production.up.railway.app/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        setPassword("");
        return;
      }

      // 🔐 MISMA LÓGICA QUE FUNCIONABA
      let role = "tenant";

      if (data.user.tipo === "propietario") {
        role = "landlord";
      } else if (
        data.user.tipo === "administrador" ||
        data.user.tipo === "admin"
      ) {
        role = "admin";
      }

      // ✅ ESTO ES LO QUE ABRE LAS SIGUIENTES VENTANAS
      setUser({
        ...data.user,
        token: data.token,
        role,
      });

      // ❌ NO navigation.navigate
      // ❌ NO modal logic
      // ✔️ RootNavigator se encarga

    } catch (error) {
      console.error(error);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <View>
      <Text style={styles.title}>Iniciar sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <View style={{ position: "relative" }}>
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={{
            position: "absolute",
            right: 10,
            top: 15,
          }}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>Ingresar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onGoForgot}>
        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onGoRegister}>
        <Text style={styles.link}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
}
