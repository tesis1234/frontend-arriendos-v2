import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { Text } from "react-native-paper";
import Header from "../../components/Header";
import styles from "../../styles/ResidenceRoomViewScreenStyles";
import * as ImagePicker from "expo-image-picker";
import MapComponent from "../../components/MapComponent";
import Icon from "react-native-vector-icons/FontAwesome5";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";

import axios from "axios";

const AdminRoomsList = ({ navigation, route }) => {
  const {
    residenceId,
    precio_mensual,
    cantidad_habitaciones,
    tipo_bano,
    comodidades_residencia,
    convivencia_residencia,
    capacidad_total,
  } = route.params;

  const { user } = useContext(AuthContext);
  const [inputHeight, setInputHeight] = useState(0);
  const [images, setImages] = useState([]); // Cambia a un array para almacenar múltiples imágenes
  const [rooms, setRooms] = useState([]);
  const [isEditing] = useState(false);
  const [imageIndices, setImageIndices] = useState({});
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Se requiere permiso para acceder a la galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]); // Agrega la nueva imagen al array
    }
  };

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://backend-arriendos-v2-production.up.railway.app/api/auth/rooms/by-residence/${residenceId}`
      );
      setRooms(response.data || []);
    } catch (error) {
      console.error("Error al cargar cuartos:", error);
      alert("No se pudieron cargar los cuartos.");
    } finally {
      setLoading(false);
    }
  }, [residenceId]);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [fetchRooms])
  );

  useEffect(() => {
    if (!user) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      navigation.navigate("Login");
      return;
    }

    if (!residenceId) {
      alert("No se proporcionó el ID de la residencia.");
      navigation.goBack();
      return;
    }
  }, [user, residenceId, fetchRooms, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={isWeb ? styles.webContainer : styles.flex}>
        {loading ? (
          <Text>Cargando...</Text> // Indicador de carga
        ) : rooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>Cuartos sin registrar</Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => {
                if (rooms.length >= cantidad_habitaciones) {
                  alert(
                    "Ya has registrado todas las habitaciones permitidas para esta residencia."
                  );
                  return;
                }
                navigation.navigate("RegisterRoom", {
                  idPropiedad: residenceId,
                  cantidad_habitaciones,
                  habitaciones_registradas: rooms.length,
                  habitaciones_registradas_array: rooms.map(
                    (r) => r.numero_habitacion
                  ),
                  precio_total_residencia: precio_mensual,
                  sumaPreciosActuales: rooms.reduce((sum, r) => {
                    const precio = Number(r?.precio_mensual) || 0;
                    return Number(sum) + precio;
                  }, 0),

                  tipo_bano,
                  comodidades_residencia,
                  convivencia_residencia,
                  capacidad_total,
                  capacidad_actual: rooms.reduce(
                    (sum, r) => sum + r.capacidad,
                    0
                  ),
                });
              }}
            >
              <Text style={styles.buttonText}>Registrar cuarto</Text>
            </TouchableOpacity>

            <View style={{ alignItems: "flex-start", marginTop: 20 }}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.buttonText}>Atrás</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView
            style={isWeb ? styles.webScrollView : styles.flex}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <Header isLoggedIn={true} />

            {rooms.map((room, index) => (
              <View key={index} style={styles.container}>
                <View style={styles.residenceContent}></View>
                <View style={[styles.form, { width: inputWidth }]}>
                  {isEditing && (
                    <TouchableOpacity
                      onPress={pickImage}
                      style={[styles.imagePicker, { width: inputWidth }]}
                    >
                      {images.length > 0 ? (
                        <Image
                          source={{ uri: images[0] }} // Muestra solo la primera imagen
                          style={styles.imagePreview}
                          onError={() => {
                            console.error("Error al cargar la imagen");
                          }}
                        />
                      ) : (
                        <Text style={styles.imagePlaceholder}>
                          + Agregar imagen
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                  <View style={[styles.carouselWrapper, { width: inputWidth }]}>
                    <View style={styles.carouselContainer}>
                      {(() => {
                        const fotosArray = JSON.parse(room.fotos || "[]");
                        const imageUrls = fotosArray.map(
                          (foto) => `https://backend-arriendos-v2-production.up.railway.app/images/${foto}`
                        );
                        const currentIndex = imageIndices[index] || 0;

                        if (imageUrls.length === 0) {
                          return (
                            <Text style={styles.imagePlaceholder}>
                              Sin imágenes
                            </Text>
                          );
                        }

                        return (
                          <>
                            <Image
                              source={{ uri: imageUrls[currentIndex] }}
                              style={styles.carouselImage}
                              resizeMode="cover"
                            />
                            {imageUrls.length > 1 && (
                              <View style={styles.arrowContainer}>
                                <TouchableOpacity
                                  onPress={() =>
                                    setImageIndices((prev) => ({
                                      ...prev,
                                      [index]:
                                        currentIndex === 0
                                          ? imageUrls.length - 1
                                          : currentIndex - 1,
                                    }))
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
                                    setImageIndices((prev) => ({
                                      ...prev,
                                      [index]:
                                        currentIndex === imageUrls.length - 1
                                          ? 0
                                          : currentIndex + 1,
                                    }))
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
                        );
                      })()}
                    </View>
                  </View>

                  <View key={index} style={styles.container}>
                    <Text style={styles.title}>Cuarto {index + 1}</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textAreaAuto,
                        { height: Math.max(40, inputHeight) },
                      ]}
                      value={room?.caracteristicas || ""}
                      multiline
                      editable={false}
                      scrollEnabled={false}
                      onContentSizeChange={(event) =>
                        setInputHeight(event.nativeEvent.contentSize.height)
                      }
                    />
                  </View>

                  <View style={styles.iconContainer}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("RentalRequests")}
                    >
                      <Icon name="users" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailsColumn}>
                      <Text style={styles.detailsText}>
                        Número de habitación:{" "}
                        {room?.numero_habitacion ?? "No especificado"}
                      </Text>
                      <Text style={styles.detailsText}>
                        $ {room?.precio_mensual || 0} al mes
                      </Text>
                      <Text style={styles.detailsText}>
                        {room?.tipo_arrendatario || ""}
                      </Text>

                      <Text style={styles.detailsText}>
                        {room?.cantidad_banos_individuales || 0} Baño(s)
                        Individual(es)
                      </Text>

                      <Text style={styles.detailsText}>
                        {room?.cantidad_parqueaderos || 0} Parqueadero(s)
                      </Text>
                    </View>

                    <View style={styles.detailsColumn}>
                      <Text style={styles.detailsText}>Forma de pago</Text>
                      <Text style={styles.detailsSubText}>
                        {room?.metodos_pago || ""}
                      </Text>
                      <Text style={styles.detailsText}>Comodidades</Text>
                      <Text style={styles.detailsSubText}>
                        {room?.comodidades || ""}
                      </Text>
                      <Text style={styles.detailsText}>Convivencia</Text>
                      <Text style={styles.detailsSubText}>
                        {room?.convivencia || ""}
                      </Text>
                      <Text style={styles.detailsText}>Capacidad</Text>
                      <Text style={styles.detailsSubText}>
                        {room?.capacidad ?? "No especificado"} personas
                      </Text>
                      <Text style={styles.detailsText}>Disponibilidad</Text>
                      <Text style={styles.detailsSubText}>
                        {room?.disponibilidad ?? "No especificada"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsText}>
                    <Text style={styles.label}>Ubicación</Text>
                    <TextInput
                      style={styles.input}
                      value={room?.direccion || ""}
                      editable={false}
                      placeholder="Dirección no disponible"
                    />
                  </View>

                  <MapComponent
                    latitude={
                      isNaN(Number(room?.latitud))
                        ? -1.66355
                        : Number(room?.latitud)
                    }
                    longitude={
                      isNaN(Number(room?.longitud))
                        ? -78.654646
                        : Number(room?.longitud)
                    }
                  />

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.register]}
                      onPress={() => {
                        navigation.navigate("AdminEditRoom", {
                          roomId: room.id_habitacion,
                          residenciaId: residenceId,

                          cantidad_habitaciones,
                          habitaciones_registradas: rooms.length,
                          habitaciones_registradas_array: rooms.map(
                            (r) => r.numero_habitacion
                          ),

                          precio_total_residencia: precio_mensual,

                          sumaPreciosActuales: rooms.reduce((sum, r) => {
                            const precio = Number(r?.precio_mensual) || 0;
                            return Number(sum) + precio;
                          }, 0),

                          capacidad_total,
                          capacidad_actual: rooms.reduce(
                            (sum, r) => sum + r.capacidad,
                            0
                          ),

                          comodidades_residencia,
                          convivencia_residencia,

                          roomData: room,
                        });
                      }}
                    >
                      <Text style={styles.buttonText}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default AdminRoomsList;
