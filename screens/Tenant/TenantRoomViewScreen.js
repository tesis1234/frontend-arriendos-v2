import React, { useContext, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput,
} from "react-native";
import { Text } from "react-native-paper";
import Header from "../../components/Header";
import styles from "../../styles/TenantViewScreenStyles";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import MapComponent from "../../components/MapComponent";
import NotificationService from "../../services/NotificationService";
import axios from "axios";

const TenantRoomViewScreen = ({ navigation, route }) => {
  const { roomData } = route.params;

  const {
    id_propiedad,
    id_habitacion,
    numero_habitacion,
    fotos,
    direccion,
    latitud,
    longitud,
    precio_mensual,
    comodidades,
    convivencia,
    disponibilidad,
    tipo_arrendatario,
    capacidad,
    metodos_pago,
  } = roomData;

  const { user } = useContext(AuthContext);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [inputHeight, setInputHeight] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "95%";
  const [rentalStatus, setRentalStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      navigation.navigate("Login");
    }
  }, [user, navigation]);

  // Verifica si ya hay una solicitud activa para este cuarto
  useEffect(() => {
    const checkRentalStatus = async () => {
      try {
        const response = await axios.get(
          "https://backend-arriendos-v2-production.up.railway.app/api/solicitudes/check-room",
          {
            params: {
              id_estudiante: user.id,
              id_propiedad: route.params.residenceId,
              id_habitacion: route.params.roomData.id_habitacion,
            },
          }
        );
        setRentalStatus(response.data.estado);
      } catch (error) {
        console.error("Error al verificar estado de solicitud:", error);
      }
    };

    if (user?.id && id_habitacion) {
      checkRentalStatus();
    }
  }, [
    user.id,
    id_habitacion,
    route.params.residenceId,
    route.params.roomData.id_habitacion,
  ]);

  const fotosArray = fotos ? JSON.parse(fotos) : [];
  const imageUrls = fotosArray.map(
    (foto) => `https://backend-arriendos-v2-production.up.railway.app/images/${foto}`
  );

  const handleRentalRequest = async () => {
    if (isLoading || rentalStatus !== null) return;

    setIsLoading(true);

    try {
      // ✅ Verificar si ya existe una solicitud
      const checkResponse = await axios.get(
        "https://backend-arriendos-v2-production.up.railway.app/api/solicitudes/check-room",
        {
          params: {
            id_estudiante: user.id,
            id_propiedad: route.params.residenceId,
            id_habitacion: id_habitacion,
          },
        }
      );

      if (checkResponse.data.estado) {
        alert("Ya tienes una solicitud pendiente para este cuarto.");
        setRentalStatus("pendiente");
        return;
      }

      // ✅ Crear la solicitud
      const requestResponse = await axios.post(
        "https://backend-arriendos-v2-production.up.railway.app/api/solicitudes",
        {
          id_estudiante: user.id,
          id_propiedad: route.params.residenceId,
          id_habitacion: id_habitacion,
        }
      );

      if (requestResponse.status === 201) {
        // ✅ Obtener datos del propietario
        const propertyResponse = await axios.get(
          `https://backend-arriendos-v2-production.up.railway.app/api/auth/properties/${route.params.residenceId}`
        );

        const propertyData = propertyResponse.data;

        // Enviar notificación al propietario
        await axios.post("https://backend-arriendos-v2-production.up.railway.app/api/notifications/send", {
          recipientId: propertyData.id_propietario,
          senderId: user.id,
          type: "arriendo",
          title: "Nueva solicitud de arriendo",
          message: `${user.nombres} ${user.apellidos} ha solicitado alquilar el cuarto ${numero_habitacion}.`,
          data: {
            tenantId: user.id,
            propertyId: route.params.residenceId,
            roomId: id_habitacion,
          },
        });

        alert(
          "Solicitud de alquiler enviada exitosamente. El propietario será notificado."
        );
        setRentalStatus("pendiente");
        setTimeout(() => navigation.goBack(), 1000);
      }
    } catch (error) {
      console.error("Error al enviar solicitud:", error);

      if (error.response?.status === 409) {
        alert("Ya tienes una solicitud pendiente para este cuarto.");
        setRentalStatus("pendiente");
      } else {
        alert("Error al enviar la solicitud. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Enviando...";
    if (rentalStatus === "pendiente") return "Solicitud enviada";
    if (rentalStatus === "aceptado") return "Solicitud aceptada";
    if (rentalStatus === "rechazado") return "Solicitud rechazada";
    return "Alquilar";
  };

  const getButtonStyle = () => {
    if (rentalStatus === "aceptado") return { backgroundColor: "green" };
    if (rentalStatus === "rechazado") return { backgroundColor: "red" };
    if (rentalStatus === "pendiente" || isLoading)
      return { backgroundColor: "gray" };
    return {};
  };

  const isButtonDisabled = () => {
    return (
      isLoading ||
      rentalStatus !== null ||
      disponibilidad?.toLowerCase() !== "disponible"
    );
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
          contentContainerStyle={[
            styles.scrollViewContent,
            { alignItems: "center" },
          ]}
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
          <Header isLoggedIn={true} />

          <View style={[styles.form, { width: inputWidth }]}>
            <View style={[styles.carouselWrapper, { width: "100%" }]}>
              <View style={styles.carouselContainer}>
                {imageUrls.length > 0 ? (
                  <>
                    <Image
                      source={{ uri: imageUrls[currentImageIndex] }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                    {imageUrls.length > 1 && (
                      <View style={styles.arrowContainer}>
                        <TouchableOpacity
                          onPress={() =>
                            setCurrentImageIndex(
                              currentImageIndex === 0
                                ? imageUrls.length - 1
                                : currentImageIndex - 1
                            )
                          }
                          style={styles.arrowButton}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={32}
                            color="#fff"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            setCurrentImageIndex(
                              currentImageIndex === imageUrls.length - 1
                                ? 0
                                : currentImageIndex + 1
                            )
                          }
                          style={styles.arrowButton}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={32}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.imagePlaceholder}>Sin imágenes</Text>
                )}
              </View>
            </View>

            <Text style={styles.title}>
              Habitación {numero_habitacion || ""}
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textAreaAuto,
                { height: Math.max(40, inputHeight) },
              ]}
              value={`Capacidad: ${capacidad}\nDisponibilidad: ${disponibilidad}`}
              multiline
              editable={false}
              scrollEnabled={false}
              onContentSizeChange={(event) =>
                setInputHeight(event.nativeEvent.contentSize.height)
              }
            />

            <View style={styles.detailsRow}>
              <View style={styles.detailsColumn}>
                <Text style={styles.detailsText}>Precio mensual:</Text>
                <Text style={styles.detailsSubText}>$ {precio_mensual}</Text>
                <Text style={styles.detailsText}>Tipo de arrendatario:</Text>
                <Text style={styles.detailsSubText}>{tipo_arrendatario}</Text>
                <Text style={styles.detailsText}>Método de pago:</Text>
                <Text style={styles.detailsSubText}>{metodos_pago}</Text>
              </View>

              <View style={styles.detailsColumn}>
                <Text style={styles.detailsText}>Comodidades</Text>
                <Text style={styles.detailsSubText}>{comodidades}</Text>
                <Text style={styles.detailsText}>Convivencia</Text>
                <Text style={styles.detailsSubText}>{convivencia}</Text>
              </View>
            </View>

            <View style={styles.detailsText}>
              <Text style={styles.label}>Ubicación</Text>
              <TextInput
                style={styles.input}
                value={direccion}
                editable={false}
                placeholder="Dirección no disponible"
              />
            </View>

            <MapComponent
              latitude={isNaN(Number(latitud)) ? -1.66355 : Number(latitud)}
              longitude={
                isNaN(Number(longitud)) ? -78.654646 : Number(longitud)
              }
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.back]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.buttonText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.register, getButtonStyle()]}
                onPress={handleRentalRequest}
                disabled={isButtonDisabled()}
              >
                <Text style={styles.buttonText}>{getButtonText()}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default TenantRoomViewScreen;
