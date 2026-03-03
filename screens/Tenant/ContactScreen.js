import React, { useState, useEffect, useContext } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { Text } from "react-native-paper";
import Header from "../../components/Header";
import styles from "../../styles/ContactScreenStyles";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";

const ContactScreen = ({ navigation, route }) => {
  const { notificationId, rentalId } = route.params ?? {};

  const propertyId = rentalId;

  const { user } = useContext(AuthContext);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const containerWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "95%";
  const [arrendador, setArrendador] = useState(null);
  const containerStyle = isWeb
    ? { height: "100vh", overflow: "auto" }
    : { flex: 1 };

  console.log("params:", route.params);
  console.log("arrendador recibido:", arrendador);

  console.log(user);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      Alert.alert("Error", "No se recibió el ID de la propiedad");
      return;
    }


    const fetchPropertyDetails = async () => {
      try {
        const response = await axios.get(
          `https://backend-arriendos-v2-production.up.railway.app/api/auth/properties/${propertyId}`
        );
        setProperty(response.data);
      } catch (error) {
        console.error("Error al cargar detalles de la propiedad:", error);
        Alert.alert(
          "Error",
          "No se pudieron cargar los detalles de la propiedad"
        );
      } finally {
        setLoading(false);
      }
    };

    const markNotificationAsRead = async () => {
      if (notificationId) {
        try {
          await axios.put(
            `https://backend-arriendos-v2-production.up.railway.app/api/notifications/${notificationId}/read`
          );
        } catch (error) {
          console.error("Error al marcar notificación como leída:", error);
        }
      }
    };
    const fetchLandlordDetails = async () => {
      try {
        const response = await axios.get(
          `https://backend-arriendos-v2-production.up.railway.app/api/auth/properties/${propertyId}`
        );
        const propertyData = response.data;

        if (propertyData?.id_propietario) {
          const userResponse = await axios.get(
            `https://backend-arriendos-v2-production.up.railway.app/api/auth/users/${propertyData.id_propietario}`
          );
          const userData = userResponse.data[0];

          console.log("Respuesta del backend (usuario):", userResponse.data);

          setArrendador({
            nombres: userData.nombres,
            apellidos: userData.apellidos,
            email: userData.email,
            telefono: userData.telefono,
            cedula: userData.cedula,
          });
        }
      } catch (error) {
        console.error("Error al obtener datos del arrendador:", error);
      }
    };
    fetchPropertyDetails();
    markNotificationAsRead();
    fetchLandlordDetails();
  }, [propertyId, notificationId]);

  const handleCallArrendador = () => {
    if (arrendador?.telefono) {
      Linking.openURL(`tel:${arrendador.telefono}`);
    } else {
      Alert.alert("Error", "Número de teléfono no disponible");
    }
  };

  const handleEmailArrendador = () => {
    if (arrendador?.email) {
      Linking.openURL(`mailto:${arrendador.email}`);
    } else {
      Alert.alert("Error", "Email no disponible");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }
  const ContentComponent = () => (
    <View style={[styles.container, { width: containerWidth }]}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={60} color="#2196F3" />
        <Text style={styles.title}>Solicitud de Alquiler</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Información del Arrendador</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>
            {arrendador?.nombres} {arrendador?.apellidos}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{arrendador?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Teléfono:</Text>
          <Text style={styles.value}>{arrendador?.telefono}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Cédula:</Text>
          <Text style={styles.value}>{arrendador?.cedula}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Propiedad de Interés</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Título:</Text>
          <Text style={styles.value}>{property?.titulo}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Precio:</Text>
          <Text style={styles.value}>${property?.precio_mensual} mensual</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Dirección:</Text>
          <Text style={styles.value}>{property?.direccion}</Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Acciones</Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={handleCallArrendador}
        >
          <Ionicons name="call" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Llamar Arrendador</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.emailButton]}
          onPress={handleEmailArrendador}
        >
          <Ionicons name="mail" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Enviar Email</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={containerStyle}>
      <Header isLoggedIn={true} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            alignItems: "center",
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          scrollEnabled={true}

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
          <ContentComponent />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ContactScreen;
