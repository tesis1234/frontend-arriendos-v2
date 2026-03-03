import React, { useEffect, useContext, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { Text } from "react-native-paper";
import Header from "../../components/Header";
import styles from "../../styles/RentalRequestsScreenStyles";
import axios from "axios";

import Icon from "react-native-vector-icons/FontAwesome5";

import { AuthContext } from "../../context/AuthContext";

const RentalRequestsScreen = ({ navigation }) => {
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";

  const fontSizeTitle = isWeb ? 40 : screenWidth * 0.12;
  const [interestedUsers, setInterestedUsers] = useState([]);

  const [updatedUsers, setUpdatedUsers] = useState([]);
  const { user } = useContext(AuthContext);
  useEffect(() => {
    const fetchRequests = async () => {
      if (user?.id) {
        try {
          const response = await axios.get(
            "https://backend-arriendos-v2-production.up.railway.app/api/notifications/requests/",
            {
              params: { ownerId: user.id },
            }
          );
          console.log(
            " Datos originales del backend:",
            JSON.stringify(response.data, null, 2)
          );
          // Evitar duplicados por id_notificacion
          const uniqueData = response.data.filter(
            (value, index, self) =>
              index ===
              self.findIndex(
                (t) =>
                  t.tenantId === value.tenantId &&
                  t.propertyId === value.propertyId &&
                  t.roomId === value.roomId
              )
          );

          const filteredData = uniqueData.filter(
            (item) => item.estado !== "rechazado"
          );

          setInterestedUsers(filteredData);
          setUpdatedUsers(filteredData);

          console.log("Solicitudes filtradas:", uniqueData);

          console.log("Solicitudes:", uniqueData);
        } catch (error) {
          console.error("Error al obtener solicitudes de arriendo:", error);
        }
      }
    };
    fetchRequests();
  }, [user?.id]);

  const handleDelete = async (user) => {
    try {
      await axios.post("https://backend-arriendos-v2-production.up.railway.app/api/notifications/reject", {
        tenantId: user.tenantId,
        propertyId: user.propertyId,
        roomId: user.roomId || null,
      });

      // Eliminar visualmente de la lista
      setUpdatedUsers((prev) =>
        prev.filter(
          (u) =>
            !(
              u.tenantId === user.tenantId &&
              u.propertyId === user.propertyId &&
              u.roomId === user.roomId
            )
        )
      );

      setInterestedUsers((prev) =>
        prev.filter(
          (u) =>
            !(
              u.tenantId === user.tenantId &&
              u.propertyId === user.propertyId &&
              u.roomId === user.roomId
            )
        )
      );
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
    }
  };

  const handleAccept = async (user) => {
    try {
      const fechaInicio = new Date().toISOString().split("T")[0];

      const response = await axios.post(
        "https://backend-arriendos-v2-production.up.railway.app/api/auth/rentals/accept",
        {
          id_estudiante: user.tenantId,
          id_propiedad: user.propertyId,
          id_habitacion: user.roomId || null,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaInicio,
          precio_acordado: user.precio || 0,
          deposito_garantia: null,
          condiciones_especiales: null,
          nombre_arrendador: user.ownerName || "Arrendador",
        }
      );

      const id_arriendo = response?.data?.id_arriendo;
      console.log("🔥 ID RECIBIDO DEL BACKEND:", id_arriendo);

      if (!id_arriendo) {
        Alert.alert("Error", "El servidor no devolvió id_arriendo.");
        return;
      }

      // 🔥 IMPORTANTE: Actualizamos updatedUsers correctamente
      setUpdatedUsers((prev) =>
        prev.map((u) => {
          const isMatch =
            u.tenantId === user.tenantId &&
            u.propertyId === user.propertyId &&
            (u.roomId || null) === (user.roomId || null);

          console.log("MATCH?", isMatch);

          return isMatch ? { ...u, estado: "aceptado", id_arriendo } : u;
        })
      );
    } catch (error) {
      console.error("Error al aceptar solicitud:", error);
      Alert.alert("Error", "No se pudo aceptar la solicitud.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={isWeb ? styles.webContainer : styles.flex}>
        <ScrollView
          style={isWeb ? styles.webScrollView : styles.flex}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
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
          <View style={styles.container}>
            <Header isLoggedIn={true} />
            <View style={[styles.form, { width: inputWidth }]}>
              <Text
                style={[
                  styles.title,
                  { fontSize: fontSizeTitle, textAlign: "center" },
                ]}
              >
                Interesados
              </Text>
              {updatedUsers.map((u) => (
                <View
                  key={`${u.id_notificacion}-${u.propertyId}-${
                    u.roomId || "no-room"
                  }`}
                  style={styles.card}
                >
                  <View style={styles.userInfo}>
                    <Icon
                      name="user"
                      size={30}
                      color="#000"
                      style={styles.icon}
                    />
                    <View style={styles.nameSection}>
                      <Text style={styles.name}>
                        {u.firstName} {u.lastName}
                      </Text>
                      <Text style={styles.phone}>{u.telefono}</Text>
                      <Text style={styles.residenceInfo}>
                        Interesado en: {u.residenceName}
                        {u.propertyType === "Residencia" && u.roomName
                          ? ` - Cuarto ${u.roomName}`
                          : ""}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    {u.estado === "aceptado" ? (
                      // Si está aceptado, mostrar solo el botón "Ver arriendo"
                      <TouchableOpacity
                        style={[
                          styles.acceptButton,
                          { backgroundColor: "#4CAF50" },
                        ]}
                        onPress={() => {
                          console.log(
                            "ENVIANDO AL CONTRACT SCREEN EL ID:",
                            u.id_arriendo
                          );

                          if (!u.id_arriendo) {
                            Alert.alert(
                              "Error",
                              "⚠ No existe id_arriendo en este interesado."
                            );
                            return;
                          }

                          navigation.navigate("Contract", {
                            id: u.id_arriendo,
                          });
                        }}
                      >
                        <Text style={styles.buttonText}>Ver arriendo</Text>
                      </TouchableOpacity>
                    ) : (
                      // Si aún no está aceptado, mostrar botones normales
                      <>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={() => handleAccept(u)}
                        >
                          <Text style={styles.buttonText}>Aceptar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(u)}
                        >
                          <Text style={styles.buttonText}>Eliminar</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.back]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>Atrás</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RentalRequestsScreen;
