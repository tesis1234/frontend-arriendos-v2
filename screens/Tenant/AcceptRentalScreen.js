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

const AcceptRentalScreen = ({ navigation, route }) => {
  const {
    titulo,
    descripcion,
    fotos,
    direccion,
    latitud,
    longitud,
    precio_mensual,
    metodos_pago,
    comodidades,
    convivencia,
    disponibilidad,
    tipo_arrendatario,
    cantidad_hombres,
    cantidad_mujeres,
  } = route.params;

  const { user } = useContext(AuthContext);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [inputHeight, setInputHeight] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "95%";

  useEffect(() => {
    if (!user) {
      alert("Sesión expirada. Por favor inicia sesión nuevamente.");
      navigation.navigate("Login");
    }
  }, [user, navigation]);

  const fotosArray = fotos ? JSON.parse(fotos) : [];
  const imageUrls = fotosArray.map(
    (foto) => `https://backend-arriendos-v2-production.up.railway.app/images/${foto}`
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={isWeb ? styles.webContainer : styles.flex}>
        <ScrollView
          style={isWeb ? styles.webScrollView : styles.flex}
          contentContainerStyle={[styles.scrollViewContent, { alignItems: "center" }]}
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
                          <Ionicons name="chevron-back" size={32} color="#fff" />
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
                          <Ionicons name="chevron-forward" size={32} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.imagePlaceholder}>Sin imágenes</Text>
                )}
              </View>
            </View>

            <Text style={styles.title}>{titulo}</Text>

            <TextInput
              style={[
                styles.input,
                styles.textAreaAuto,
                { height: Math.max(40, inputHeight) },
              ]}
              value={descripcion}
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
                <Text style={styles.detailsSubText}>$ {precio_mensual} al mes</Text>
                <Text style={styles.detailsText}>Tipo de arrendatario:</Text>
                <Text style={styles.detailsSubText}>{tipo_arrendatario}</Text>
                <Text style={styles.detailsText}>Capacidad:</Text>
                <Text style={styles.detailsSubText}>
                  {cantidad_hombres ?? 0} hombres
                </Text>
                <Text style={styles.detailsSubText}>
                  {cantidad_mujeres ?? 0} mujeres
                </Text>
                <Text style={styles.detailsText}>Disponibilidad:</Text>
                <Text style={styles.detailsSubText}>{disponibilidad}</Text>
              </View>

              <View style={styles.detailsColumn}>
                <Text style={styles.detailsText}>Forma de pago</Text>
                <Text style={styles.detailsSubText}>{metodos_pago}</Text>
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
              longitude={isNaN(Number(longitud)) ? -78.654646 : Number(longitud)}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.back]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.buttonText}>Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.register]}
                onPress={() => alert("Solicitud de alquiler enviada.")}
              >
                <Text style={styles.buttonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AcceptRentalScreen;
