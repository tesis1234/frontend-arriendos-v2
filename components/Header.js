// components/Header.js
import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../constants/colors";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";

export default function Header({
  isLoggedIn = false,
  onLoginPress,
  onRegisterPress,
}) {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, setUser } = useContext(AuthContext);

  const currentScreen = route?.name || "Home";
  const isAdminScreen = currentScreen.startsWith("Admin");

  // Solo en Home, sin sesión, no admin
  const showAuthButtons = currentScreen === "Home" && !user && !isAdminScreen;

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("¿Estás seguro de que quieres cerrar sesión?");
      if (confirmed) setUser(null);
    } else {
      Alert.alert("Cerrar sesión", "¿Estás seguro de que quieres cerrar sesión?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: () => setUser(null) },
      ]);
    }
  };

  const goHome = () => {
    if (isAdminScreen) return navigation.navigate("AdminDashboard");

    if (!user) return navigation.navigate("Home");
    if (user.role === "landlord") return navigation.navigate("RegisterProperty");
    return navigation.navigate("Tenant");
  };

  return (
    <View style={styles.header}>
      {/* Home */}
      <TouchableOpacity onPress={goHome}>
        <Ionicons name="home" size={28} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.right}>
        {/* ✅ Login/Register deben ABRIR MODAL (si mandas props) */}
        {showAuthButtons && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.login]}
              onPress={() => (onLoginPress ? onLoginPress() : navigation.navigate("Login"))}
            >
              <Text style={styles.text}>Ingresar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.register]}
              onPress={() => (onRegisterPress ? onRegisterPress() : navigation.navigate("Register"))}
            >
              <Text style={styles.text}>Registrarse</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Perfil + Logout */}
        {!!user && !isAdminScreen && (
          <>
            <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
              <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 10 }}>
              <Ionicons name="log-out-outline" size={28} color="red" />
            </TouchableOpacity>
          </>
        )}

        {/* Logout admin */}
        {!!user && isAdminScreen && (
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="red" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    alignItems: "center",
    width: "100%",
  },
  right: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  button: {
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  register: { backgroundColor: "#f6a700" },
  login: { backgroundColor: "#000" },
  text: { color: "#fff", fontWeight: "bold" },
});
