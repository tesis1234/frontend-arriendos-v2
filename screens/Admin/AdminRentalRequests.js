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

const AdminRentalRequests = ({ navigation }) => {
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
      console.log("ID CREADO DEL ARRIENDO:", id_arriendo);

      if (!id_arriendo) {
        Alert.alert(
          "Error",
          "No se obtuvo el id del arriendo desde el servidor."
        );
        return;
      }
      user.id_arriendo = id_arriendo;
      // Actualiza la lista local agregando id_arriendo y estado aceptado
      setUpdatedUsers((prev) =>
        prev.map((u) =>
          u.tenantId === user.tenantId &&
          u.propertyId === user.propertyId &&
          (u.roomId || null) === (user.roomId || null)
            ? { ...u, estado: "aceptado", id_arriendo } // <-- aquí se guarda
            : u
        )
      );

      setInterestedUsers((prev) =>
        prev.map((u) =>
          u.tenantId === user.tenantId &&
          u.propertyId === user.propertyId &&
          (u.roomId || null) === (user.roomId || null)
            ? { ...u, estado: "aceptado", id_arriendo } // <-- también aquí
            : u
        )
      );
    } catch (error) {
      console.error(
        "Error al aceptar solicitud:",
        error?.response?.data || error.message || error
      );
      Alert.alert(
        "Error",
        "No se pudo aceptar la solicitud. Revisa la consola."
      );
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
              {updatedUsers.map((user) => (
                <View
                  key={`${user.id_notificacion}-${user.propertyId}-${
                    user.roomId || "no-room"
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
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text style={styles.phone}>{user.telefono}</Text>
                      <Text style={styles.residenceInfo}>
                        Interesado en: {user.residenceName}
                        {user.propertyType === "Residencia" && user.roomName
                          ? ` - Cuarto ${user.roomName}`
                          : ""}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    {user.estado === "aceptado" ? (
                      // Si está aceptado, mostrar solo el botón "Ver arriendo"
                      <TouchableOpacity
                        style={[
                          styles.acceptButton,
                          { backgroundColor: "#4CAF50" },
                        ]}
                        onPress={() => {
                          console.log(
                            "ID QUE ESTAMOS ENVIANDO:",
                            user.id_arriendo
                          );
                          navigation.navigate("Contract", {
                            id: user.id_arriendo,
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
                          onPress={() => handleAccept(user)}
                        >
                          <Text style={styles.buttonText}>Aceptar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(user)}
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

export default AdminRentalRequests;
