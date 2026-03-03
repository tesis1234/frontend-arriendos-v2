import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import Header from "../../components/Header";
import styles from "../../styles/LoginScreenStyles";
import { AuthContext } from "../../context/AuthContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(AuthContext);

  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.9, 400) : "100%";
  const [showPassword, setShowPassword] = useState(false);

  const validateLoginData = () => {
    if (!email || !password) {
      alert("Por favor completa todos los campos.");
      return false;
    }
    return true;
  };

  const buildLoginPayload = () => {
    return JSON.stringify({ email, password });
  };

  const sendLoginRequest = async (payload) => {
    const response = await fetch("https://backend-arriendos-v2-production.up.railway.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    return await response.json();
  };

  const handleLogin = async () => {
    if (!validateLoginData()) return;
    const payload = buildLoginPayload();
    const data = await sendLoginRequest(payload);

    if (data.success) {
      let role = "tenant";

      if (data.user.tipo === "propietario") {
        role = "landlord";
      } else if (
        data.user.tipo === "administrador" ||
        data.user.tipo === "admin"
      ) {
        role = "admin";
      }

      setUser({
        ...data.user,
        token: data.token,
        role: role,
      });
    } else {
      alert(data.message);
      setEmail("");
      setPassword("");
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
          source={require("../../assets/user-icon.png")}
          style={styles.icon}
        />

        <View style={{ width: inputWidth }}>
          <Text style={styles.label}>Usuario:</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>

        <View style={{ width: inputWidth }}>
          <Text style={styles.label}>Contraseña:</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Registrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
