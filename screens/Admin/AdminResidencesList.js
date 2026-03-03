import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import Header from "../../components/Header";
import MapComponent from "../../components/MapComponent";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import styles from "../../styles/ResidenceViewScreenStyles"; // reutilizamos tus estilos

export default function AdminResidencesList({ navigation }) {
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageIndices, setImageIndices] = useState({});

  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const containerWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";

  // ⭐ Mapeo igual al de tu Vista del Dueño
  const mapComodidades = {
    "Ducha eléctrica": "electricShower",
    "Ducha con calefón": "showerHeater",
    Lavadora: "washer",
    Secadora: "dryer",
    Internet: "internet",
    Agua: "water",
    Luz: "light",
  };

  const mapConvivencia = {
    "Mascotas permitidas": "petsAllowed",
    "Baño compartido": "sharedBathroom",
    "Ducha compartida": "sharedShower",
    "Cocina compartida": "sharedKitchen",
    "Sala compartida": "sharedLivingRoom",
    "Comedor compartido": "sharedDinigRoom",
  };

  // 🔥 Cargar TODAS las residencias (sin filtrar por usuario)
  const loadResidences = async () => {
    try {
      const response = await axios.get(
        "https://backend-arriendos-v2-production.up.railway.app/api/admin/residences"
      );
      setResidences(response.data);
    } catch (error) {
      console.error("Error cargando residencias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResidences();
  }, []);

  if (loading) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Cargando residencias...</Text>
      </View>
    );
  }

  if (residences.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <Text>No hay residencias registradas.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <Header isLoggedIn={true} />

      {residences.map((residence, index) => {
        const fotosArray = JSON.parse(residence.fotos || "[]");
        const imageUrls = fotosArray.map(
          (foto) => `https://backend-arriendos-v2-production.up.railway.app/images/${foto}`
        );
        const currentIndex = imageIndices[index] || 0;

        const comodidadesKeys = (residence.comodidades || "")
          .split(", ")
          .map((c) => mapComodidades[c])
          .filter(Boolean);

        const convivenciaKeys = (residence.convivencia || "")
          .split(", ")
          .map((c) => mapConvivencia[c])
          .filter(Boolean);

        return (
          <View
            key={`admin-residence-${residence.id_propiedad}`}
            style={styles.container}
          >
            {/* 📌 Carrusel de imágenes */}
            <View style={[styles.carouselWrapper, { width: containerWidth }]}>
              <View style={styles.carouselContainer}>
                {imageUrls.length > 0 ? (
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
                ) : (
                  <Text style={styles.imagePlaceholder}>Sin imágenes</Text>
                )}
              </View>
            </View>

            <View style={[styles.form, { width: containerWidth }]}>
              <Text style={styles.title}>Residencia #{index + 1}</Text>

              <TextInput
                style={[styles.input, styles.textAreaAuto]}
                value={residence.descripcion}
                multiline
                editable={false}
              />

              {/* DATOS */}
              <View style={styles.detailsRow}>
                <View style={styles.detailsColumn}>
                  <Text style={styles.detailsText}>
                    $ {residence.precio_mensual}/mes
                  </Text>
                  <Text style={styles.detailsText}>
                    {residence.tipo_arrendatario}
                  </Text>
                  <Text style={styles.detailsText}>
                    {residence.cantidad_habitaciones} Habitación(es)
                  </Text>
                  <Text style={styles.detailsText}>
                    {residence.cantidad_banos_individuales} Baño(s)
                    Individual(es)
                  </Text>
                </View>

                <View style={styles.detailsColumn}>
                  <Text style={styles.detailsText}>Comodidades</Text>
                  <Text style={styles.detailsSubText}>
                    {residence.comodidades}
                  </Text>

                  <Text style={styles.detailsText}>Convivencia</Text>
                  <Text style={styles.detailsSubText}>
                    {residence.convivencia}
                  </Text>
                </View>
              </View>

              {/* DIRECCIÓN */}
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                editable={false}
                value={residence.direccion || ""}
              />

              {/* MAPA */}
              <MapComponent
                latitude={Number(residence.latitud) || -1.6635}
                longitude={Number(residence.longitud) || -78.6546}
              />

              {/* BOTONES */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.back]}
                  onPress={() =>
                    navigation.navigate("AdminRoomsList", {
                      residenceId: residence.id_propiedad,
                      precio_mensual: residence.precio_mensual,
                      cantidad_habitaciones: residence.cantidad_habitaciones,
                      tipo_bano: residence.tipo_bano,
                      comodidades_residencia: residence.comodidades,
                      convivencia_residencia: residence.convivencia,
                      capacidad_total:
                        residence.capacidad_total ??
                        (residence.cantidad_hombres || 0) +
                          (residence.cantidad_mujeres || 0),
                    })
                  }
                >
                  <Text style={styles.buttonText}>Ver cuartos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.register]}
                  onPress={() =>
                    navigation.navigate("AdminEditResidence", {
                      residenceId: residence.id_propiedad,
                    })
                  }
                >
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
