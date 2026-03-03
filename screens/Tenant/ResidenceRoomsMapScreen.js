import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Header from "../../components/Header";
import styles from "../../styles/RegisterPropertyScreenStyles";

const API_URL = "https://backend-arriendos-v2-production.up.railway.app";


const ResidenceRoomsMapScreen = ({ route, navigation }) => {
  const { residenceId } = route.params;
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/rooms/by-residence/${residenceId}`);

        const data = await res.json();
        setRooms(data);
      } catch (error) {
        console.error("Error al obtener habitaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [residenceId]);

  const getColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "disponible":
        return "#4CAF50"; // verde
      case "ocupado":
        return "#F44336"; // rojo
      case "mantenimiento":
        return "#FFC107"; // amarillo
      default:
        return "#BDBDBD"; // gris por defecto
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>Cargando cuartos...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>
      <Header title="Mapa de Cuartos" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 20,
        }}
      >
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
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 20 }}>
          Selecciona un cuarto
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.id_habitacion}
              onPress={() => {
                if (room.disponibilidad?.toLowerCase() === "disponible") {
                  navigation.navigate("TenantRoomView", {
                    roomData: room,
                    residenceId: residenceId,
                  });
                }
              }}
              disabled={room.disponibilidad?.toLowerCase() !== "disponible"}
              style={{
                width: 70,
                height: 70,
                borderRadius: 10,
                backgroundColor: getColor(room.disponibilidad),
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                {room.numero_habitacion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ResidenceRoomsMapScreen;
