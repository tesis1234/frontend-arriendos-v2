import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Header from "../../components/Header";
const screenWidth = Dimensions.get("window").width;
const isWeb = Platform.OS === "web";
const containerWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";

export default function AdminUsersList({ navigation }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarUsuarios();
    }, [])
  );

  const cargarUsuarios = async () => {
    try {
      const response = await axios.get(
        "https://backend-arriendos-v2-production.up.railway.app/api/admin/usuarios"
      );
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.log("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtrar = (texto) => {
    setSearch(texto);
    if (texto.trim() === "") {
      setFilteredUsers(users);
      return;
    }

    const filtro = users.filter(
      (u) =>
        u.nombres.toLowerCase().includes(texto.toLowerCase()) ||
        u.apellidos.toLowerCase().includes(texto.toLowerCase()) ||
        u.email.toLowerCase().includes(texto.toLowerCase())
    );

    setFilteredUsers(filtro);
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case "admin":
        return "#3498db";
      case "dueno":
        return "#e67e22";
      case "estudiante":
        return "#9b59b6";
      default:
        return "#7f8c8d";
    }
  };

  const getEstadoColor = (estado) => {
    return estado === "activo" ? "#2ecc71" : "#e74c3c";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* HEADER DEBE IR FUERA DEL WIDTH LIMITADO */}
      <Header isLoggedIn={true} />

      <ScrollView
        contentContainerStyle={{
          padding: 15,
          width: containerWidth,
          alignSelf: "center",
        }}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuario..."
          value={search}
          onChangeText={filtrar}
        />

        {filteredUsers.map((user) => (
          <View key={user.id_usuario} style={styles.card}>
            <Text style={styles.name}>
              {user.nombres} {user.apellidos}
            </Text>

            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.phone}>
              Teléfono: {user.telefono || "No registrado"}
            </Text>

            <View style={styles.badgesRow}>
              <Text
                style={[
                  styles.badge,
                  { backgroundColor: getRolColor(user.tipo) },
                ]}
              >
                {user.tipo.toUpperCase()}
              </Text>

              <Text
                style={[
                  styles.badge,
                  { backgroundColor: getEstadoColor(user.estado) },
                ]}
              >
                {user.estado.toUpperCase()}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#3498db" }]}
                onPress={() =>
                  navigation.navigate("AdminEditUser", {
                    userId: user.id_usuario,
                  })
                }
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor:
                      user.estado === "activo" ? "#e74c3c" : "#2ecc71",
                  },
                ]}
                onPress={async () => {
                  await axios.put(
                    `https://backend-arriendos-v2-production.up.railway.app/api/admin/usuarios/${user.id_usuario}/estado`,
                    { estado: user.estado === "activo" ? "inactivo" : "activo" }
                  );
                  cargarUsuarios();
                }}
              >
                <Ionicons
                  name={
                    user.estado === "activo"
                      ? "close-circle-outline"
                      : "checkmark-circle-outline"
                  }
                  size={18}
                  color="#fff"
                />
                <Text style={styles.actionText}>
                  {user.estado === "activo" ? "Desactivar" : "Activar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* BOTÓN ATRÁS */}
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#888",
              paddingVertical: 10,
              paddingHorizontal: 25,
              borderRadius: 8,
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Atrás</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  searchInput: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },

  name: { fontSize: 18, fontWeight: "700", color: "#2c3e50" },
  email: { color: "#34495e", marginTop: 4 },
  phone: { color: "#7f8c8d", marginTop: 2 },

  badgesRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },

  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },

  actionsRow: {
    flexDirection: "row",
    marginTop: 15,
    justifyContent: "flex-end",
    gap: 10,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },

  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  back: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "#fff",
  },
  scrollViewContent: {
    flexGrow: 1,
  },
});
