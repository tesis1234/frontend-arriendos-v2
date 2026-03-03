import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  LayoutAnimation,
  useWindowDimensions,
} from "react-native";
import { Text } from "react-native-paper";
import Header from "../../components/Header";
import styles from "../../styles/TenantViewScreenStyles";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import NotificationBanner from "../../components/NotificationBanner";
import NotificationService from "../../services/NotificationService";
import isEqual from "lodash.isequal";

const TenantViewScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [inputHeights, setInputHeights] = useState({});
  const textInputRefs = useRef({});
  const [images, setImages] = useState([]);
  const [residences, setResidences] = useState([]);
  const [isEditing] = useState(false);
  const [imageIndices, setImageIndices] = useState({});
  const [loading, setLoading] = useState(true);
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileView = Platform.OS !== "web" || (isWeb && screenWidth < 900);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const inputWidth = isWeb
    ? Math.min(screenWidth * 0.95, 600)
    : screenWidth * 0.95;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const [selectedSector, setSelectedSector] = useState(null);
  const [expandedSector, setExpandedSector] = useState(false);
  const sectorOptions = ["Barrio Chino", "Puerta Principal (Pedro Vicente Maldonado)", "Puerta Intermedia (Milton Reyes)", "Puerta de Medicina (Canónico Ramos)"];
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [comodidadesSeleccionadas, setComodidadesSeleccionadas] = useState([]);
  const [convivenciaSeleccionada, setConvivenciaSeleccionada] = useState([]);
  const notificationsRef = useRef([]);
  const mountedRef = useRef(true);
  const pollingIntervalRef = useRef(null);

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

  const fetchResidences = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Usuario actual:", user);

      const response = await axios.get(
        "https://backend-arriendos-v2-production.up.railway.app/api/auth/all-properties"
      );

      if (response.data.length > 0) {
        setResidences(response.data);
      } else {
        setResidences([]);
      }
    } catch (error) {
      console.error("Error al cargar propiedades:", error);
      alert("No se pudieron cargar las propiedades.");
    } finally {
      setLoading(false);
    }
  }, [user]);
  const loadNotifications = useCallback(async () => {
    try {
      const unread = await NotificationService.getUnreadNotifications(user?.id);

      const formatted = unread.map((n) => {
        let data = {};
        try {
          data = JSON.parse(n.data ?? "{}");
        } catch (e) {
          console.error("Error parsing notification data:", e);
        }

        const nameParts = (data.landlordName ?? "").split(" ");
        const nombres = nameParts.slice(0, 2).join(" ");
        const apellidos = nameParts.slice(2).join(" ");

        return {
          ...n,
          id: n.id_notificacion ?? n.id,
          title: n.title || "Solicitud aceptada",
          message: n.mensaje || n.body || data.message || "Nueva notificación",
          screen: "Contact",
          rentalId: data.propertyId ?? null,
          arrendador: {
            nombres: nombres || "",
            apellidos: apellidos || "",
            email: data.landlordEmail ?? "",
            telefono: data.landlordPhone ?? "",
          },
        };
      });

      if (!isEqual(formatted, notificationsRef.current)) {
        notificationsRef.current = formatted;

        if (mountedRef.current) {
          setNotifications(formatted);

          if (formatted.length > 0) {
            setCurrentNotification(formatted[0]);
            setShowNotification(true);
          } else {
            setCurrentNotification(null);
            setShowNotification(false);
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  }, [user?.id]);
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = setInterval(async () => {
      if (mountedRef.current && user?.id) {
        await loadNotifications();
      }
    }, 3000); // cada 3 segundos
  }, [loadNotifications, user?.id]);
  useEffect(() => {
    if (user?.id) {
      startPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [startPolling, user?.id]);

  useEffect(() => {
    if (Platform.OS === "web") {
      const newHeights = {};
      Object.keys(textInputRefs.current).forEach((key) => {
        const ref = textInputRefs.current[key];
        if (ref) {
          newHeights[key] = ref.scrollHeight;
        }
      });
      setInputHeights(newHeights);
    }
  }, [residences]);

  useEffect(() => {
    setCurrentPage(1);
    if (user?.id) {
      fetchResidences();
    }
  }, [fetchResidences, user?.id]);

  const applyFilters = (residences) => {
    return residences.filter((r) => {
      const matchesSearch =
        searchTerm === "" ||
        r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.titulo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPrice =
        priceFilter === "" ||
        parseFloat(r.precio_mensual) === parseFloat(priceFilter);

      const matchesComodidades = comodidadesSeleccionadas.every((c) =>
        r.comodidades?.toLowerCase().includes(c.toLowerCase())
      );

      const matchesConvivencia = convivenciaSeleccionada.every((c) =>
        r.convivencia?.toLowerCase().includes(c.toLowerCase())
      );

      return (
        (!selectedSector || r.sector === selectedSector) &&
        matchesSearch &&
        matchesPrice &&
        matchesComodidades &&
        matchesConvivencia
      );
    });
  };

  useEffect(() => {
    console.log("Notificaciones actuales:", notifications);
  }, [notifications]);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id, loadNotifications]);

  useEffect(() => {
    if (user?.id) {
      const subscription = NotificationService.setupNotificationListener(
        (notification) => {
          console.log("Notificación recibida en tiempo real:", notification);

          const formattedNotification = (() => {
            let parsedData = {};
            try {
              parsedData =
                typeof notification.data === "string"
                  ? JSON.parse(notification.data)
                  : notification.data || {};
            } catch (e) {
              console.error("Error parsing notification data:", e);
            }

            const nombreArrendador =
              parsedData.nombre_arrendador ?? "El arrendador";
            const mensajeGenerado = `${nombreArrendador} aceptó tu solicitud de arrendamiento.`;

            return {
              ...notification,
              title: notification.title || "Solicitud aceptada",
              message:
                notification.mensaje &&
                notification.mensaje !== "Nueva notificación"
                  ? notification.mensaje
                  : notification.body &&
                    notification.body !== "Nueva notificación"
                  ? notification.body
                  : parsedData.message &&
                    parsedData.message !== "Nueva notificación"
                  ? parsedData.message
                  : mensajeGenerado,
              screen: parsedData.screen,
              rentalId: parsedData.rentalId,
            };
          })();

          const newNotifications = [
            formattedNotification,
            ...notificationsRef.current,
          ];
          notificationsRef.current = newNotifications;

          if (mountedRef.current) {
            setNotifications(newNotifications);

            if (!showNotification) {
              setCurrentNotification(formattedNotification);
              setShowNotification(true);
            }
          }
        }
      );

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    }
  }, [user?.id, showNotification]);

  const handleNotificationPress = async () => {
    console.log("Pantalla destino:", currentNotification?.screen);

    if (currentNotification?.screen === "Contact") {
      navigation.navigate("Contact", {
        rentalId: currentNotification.rentalId,
        notificationId: currentNotification.id,
        arrendador: currentNotification.arrendador,
      });
    }
    if (currentNotification?.id) {
      try {
        await NotificationService.markAsRead(currentNotification.id);
      } catch (error) {
        console.error("Error al marcar notificación como leída:", error);
      }
    }

    setShowNotification(false);

    showNextNotification();
  };

  const showNextNotification = useCallback(() => {
    const remainingNotifications = notificationsRef.current.filter(
      (n) => n.id !== currentNotification?.id
    );

    if (remainingNotifications.length > 0 && mountedRef.current) {
      setCurrentNotification(remainingNotifications[0]);
      setShowNotification(true);
    }
  }, [currentNotification]);
  const handleNotificationClose = async () => {
    if (currentNotification?.id) {
      try {
        await NotificationService.markAsRead(currentNotification.id);

        const updatedNotifications = notificationsRef.current.filter(
          (n) => n.id !== currentNotification.id
        );
        notificationsRef.current = updatedNotifications;
        setNotifications(updatedNotifications);
      } catch (error) {
        console.error("Error al marcar notificación como leída:", error);
      }
    }

    setShowNotification(false);
    showNextNotification();
  };

  const filteredResidences = applyFilters(residences);

  const departamentos = filteredResidences.filter(
    (r) => r.tipo_arriendo === "Departamento"
  );
  const residencias = filteredResidences.filter(
    (r) => r.tipo_arriendo === "Residencia"
  );

  const propiedadesOrdenadas = [...departamentos, ...residencias];

  const totalPages = Math.ceil(propiedadesOrdenadas.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = propiedadesOrdenadas.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  let deptCounter = 0;
  let resiCounter = 0;

  const renderFilters = () => {
    if (isMobileView) {
      const comodidadesKeys = Object.keys(mapComodidades);

      const indexDuchaElectrica =
        comodidadesKeys.indexOf("Ducha eléctrica") + 1;

      return (
        <View style={styles.mobileSidebar}>
          <TextInput
            placeholder="Buscar por palabra clave"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.input}
          />

          <View style={styles.priceFilterContainer}>
            <TextInput
              placeholder="Precio exacto"
              value={priceFilter}
              onChangeText={setPriceFilter}
              keyboardType="numeric"
              style={[styles.input, styles.priceInput]}
            />
            <TouchableOpacity
              onPress={() => setPriceFilter(priceFilter)}
              style={styles.filterButton}
            >
              <Text>Filtrar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Comodidades</Text>
          {(isFilterExpanded
            ? comodidadesKeys
            : comodidadesKeys.slice(0, indexDuchaElectrica)
          ).map((key) => (
            <View key={key} style={styles.checkboxRow}>
              <Text>{key}</Text>
              <TouchableOpacity
                onPress={() =>
                  setComodidadesSeleccionadas((prev) =>
                    prev.includes(key)
                      ? prev.filter((item) => item !== key)
                      : [...prev, key]
                  )
                }
                style={styles.checkbox}
              >
                <Text>
                  {comodidadesSeleccionadas.includes(key) ? "☑" : "☐"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {isFilterExpanded && (
            <>
              <Text style={styles.filterLabel}>Convivencia</Text>
              {Object.keys(mapConvivencia).map((key) => (
                <View key={key} style={styles.checkboxRow}>
                  <Text>{key}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setConvivenciaSeleccionada((prev) =>
                        prev.includes(key)
                          ? prev.filter((item) => item !== key)
                          : [...prev, key]
                      )
                    }
                    style={styles.checkbox}
                  >
                    <Text>
                      {convivenciaSeleccionada.includes(key) ? "☑" : "☐"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          <TouchableOpacity
            onPress={() => setIsFilterExpanded(!isFilterExpanded)}
            style={styles.expandButton}
          >
            <Text style={styles.expandButtonText}>
              {isFilterExpanded ? "Ver menos filtros ▲" : "Ver más filtros ▼"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Renderizado completo para web
      return (
        <View style={styles.webSidebar}>
          <TextInput
            placeholder="Buscar por palabra clave"
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.input}
          />

          <View style={styles.priceFilterContainer}>
            <TextInput
              placeholder="Precio exacto"
              value={priceFilter}
              onChangeText={setPriceFilter}
              keyboardType="numeric"
              style={[styles.input, styles.priceInput]}
            />
            <TouchableOpacity
              onPress={() => setPriceFilter(priceFilter)}
              style={styles.filterButton}
            >
              <Text>Filtrar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Comodidades</Text>
          {Object.keys(mapComodidades).map((key) => (
            <View key={key} style={styles.checkboxRow}>
              <Text>{key}</Text>
              <TouchableOpacity
                onPress={() =>
                  setComodidadesSeleccionadas((prev) =>
                    prev.includes(key)
                      ? prev.filter((item) => item !== key)
                      : [...prev, key]
                  )
                }
                style={styles.checkbox}
              >
                <Text>
                  {comodidadesSeleccionadas.includes(key) ? "☑" : "☐"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.filterLabel}>Convivencia</Text>
          {Object.keys(mapConvivencia).map((key) => (
            <View key={key} style={styles.checkboxRow}>
              <Text>{key}</Text>
              <TouchableOpacity
                onPress={() =>
                  setConvivenciaSeleccionada((prev) =>
                    prev.includes(key)
                      ? prev.filter((item) => item !== key)
                      : [...prev, key]
                  )
                }
                style={styles.checkbox}
              >
                <Text>{convivenciaSeleccionada.includes(key) ? "☑" : "☐"}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );
    }
  };
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <NotificationBanner
        notification={currentNotification}
        onPress={handleNotificationPress}
        onClose={handleNotificationClose}
        isVisible={showNotification}
      />

      <View style={isWeb ? styles.webContainer : styles.flex}>
        {loading ? (
          <Text>Cargando...</Text>
        ) : residences.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>Residencias sin registrar</Text>
            <Text style={styles.emptyMessage}>
              Ningún propietario ha registrado una propiedad.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={isWeb ? styles.webScrollView : styles.flex}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            
            <Header isLoggedIn={true} />

            <View
              style={
                isMobileView ? styles.mainContentMobile : styles.mainContentWeb
              }
            >
              {renderFilters()}
              <View
                style={
                  isMobileView
                    ? styles.residencesContainerMobile
                    : styles.residencesContainerWeb
                }
              >
                <View style={{ width: inputWidth, alignSelf: "center" }}>
                  <View style={styles.accordionContainer}>
                    <TouchableOpacity
                      style={styles.accordionHeader}
                      onPress={() => {
                        LayoutAnimation.configureNext(
                          LayoutAnimation.Presets.easeInEaseOut
                        );
                        setExpandedSector(!expandedSector);
                      }}
                    >
                      <Text style={styles.accordionTitle}>
                        Filtrar por sector: {selectedSector ?? "Todos"}
                      </Text>
                      <Ionicons
                        name={expandedSector ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="black"
                      />
                    </TouchableOpacity>

                    {expandedSector && (
                      <View style={styles.accordionContent}>
                        {sectorOptions.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.optionButton,
                              selectedSector === option &&
                                styles.optionSelected,
                            ]}
                            onPress={() => {
                              setSelectedSector(option);
                              LayoutAnimation.configureNext(
                                LayoutAnimation.Presets.easeInEaseOut
                              );
                              setExpandedSector(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                selectedSector === option &&
                                  styles.optionTextSelected,
                              ]}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.optionButton}
                          onPress={() => {
                            setSelectedSector(null);
                            LayoutAnimation.configureNext(
                              LayoutAnimation.Presets.easeInEaseOut
                            );
                            setExpandedSector(false);
                          }}
                        >
                          <Text style={styles.optionText}>Mostrar todos</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {currentItems.map((residence, index) => {
                  const comodidadesKeys = (residence.comodidades || "")
                    .split(", ")
                    .map((c) => mapComodidades[c])
                    .filter(Boolean);

                  const convivenciaKeys = (residence.convivencia || "")
                    .split(", ")
                    .map((c) => mapConvivencia[c])
                    .filter(Boolean);

                  return (
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
                                source={{ uri: images[0] }}
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

                        <View
                          style={[
                            styles.carouselWrapper,
                            { width: inputWidth },
                          ]}
                        >
                          <View style={styles.carouselContainer}>
                            {(() => {
                              const fotosArray = JSON.parse(
                                residence.fotos || "[]"
                              );
                              const imageUrls = fotosArray.map(
                                (foto) =>
                                  `https://backend-arriendos-v2-production.up.railway.app/images/${foto}`
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
                                              currentIndex ===
                                              imageUrls.length - 1
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
                          <Text style={styles.title}>
                            {residence.tipo_arriendo === "Departamento"
                              ? `Departamento ${++deptCounter}`
                              : `Residencia ${++resiCounter}`}
                          </Text>

                          <TextInput
                            ref={(el) => (textInputRefs.current[index] = el)}
                            style={[
                              styles.input,
                              styles.textAreaAuto,
                              {
                                height: Math.max(40, inputHeights[index] || 40),
                              },
                            ]}
                            value={residence?.descripcion ?? ""}
                            multiline
                            editable={false}
                            scrollEnabled={false}
                            onContentSizeChange={
                              Platform.OS !== "web"
                                ? (event) => {
                                    const contentSize =
                                      event?.nativeEvent?.contentSize;
                                    if (contentSize?.height) {
                                      setInputHeights((prev) => ({
                                        ...prev,
                                        [index]: contentSize.height,
                                      }));
                                    }
                                  }
                                : undefined
                            }
                          />
                        </View>

                        <View style={styles.detailsRow}>
                          <View style={styles.detailsColumn}>
                            <Text style={styles.detailsText}>
                              $ {residence?.precio_mensual || 0} al mes
                            </Text>
                            <Text style={styles.detailsText}>
                              {residence?.tipo_arrendatario || ""}
                            </Text>
                            <Text style={styles.detailsText}>
                              {residence?.cantidad_habitaciones || 0}{" "}
                              Habitación(es)
                            </Text>
                            <Text style={styles.detailsText}>
                              {residence?.cantidad_banos_individuales || 0}{" "}
                              Baño(s) Individual(es)
                            </Text>
                            <Text style={styles.detailsText}>
                              {residence?.cantidad_salas || 0} Sala(s)
                            </Text>
                            <Text style={styles.detailsText}>
                              {residence?.cantidad_parqueaderos || 0}{" "}
                              Parqueadero(s)
                            </Text>
                          </View>

                          <View style={styles.detailsColumn}>
                            <Text style={styles.detailsText}>
                              Forma de pago
                            </Text>
                            <Text style={styles.detailsSubText}>
                              {residence?.metodos_pago || ""}
                            </Text>
                            <Text style={styles.detailsText}>Comodidades</Text>
                            <Text style={styles.detailsSubText}>
                              {residence?.comodidades || ""}
                            </Text>
                            <Text style={styles.detailsText}>Convivencia</Text>
                            <Text style={styles.detailsSubText}>
                              {residence?.convivencia || ""}
                            </Text>
                          </View>
                        </View>

                        {residence.tipo_arriendo === "Residencia" && (
                          <TouchableOpacity
                            style={[styles.button, styles.secondary]}
                            onPress={() =>
                              navigation.navigate("ResidenceRoomsMap", {
                                residenceId: residence.id_propiedad,
                                precio_mensual: residence.precio_mensual,
                                cantidad_habitaciones:
                                  residence.cantidad_habitaciones,
                                tipo_bano:
                                  residence.cantidad_banos_individuales > 0 &&
                                  residence.cantidad_banos_compartidos > 0
                                    ? "mixto"
                                    : residence.cantidad_banos_individuales > 0
                                    ? "individual"
                                    : "compartido",
                                comodidades_residencia: comodidadesKeys,
                                convivencia_residencia: convivenciaKeys,
                                capacidad_total:
                                  residence.capacidad_total ??
                                  (residence.cantidad_hombres || 0) +
                                    (residence.cantidad_mujeres || 0),
                              })
                            }
                          >
                            <Text style={styles.buttonText}>
                              Cuartos de la residencia
                            </Text>
                          </TouchableOpacity>
                        )}
                        {residence.tipo_arriendo === "Departamento" && (
                          <TouchableOpacity
                            style={[styles.button, styles.secondary]}
                            onPress={() =>
                              navigation.navigate("RentalView", {
                                departamentoId: residence.id_propiedad,
                                titulo: residence.titulo,
                                descripcion: residence.descripcion,
                                precio_mensual: residence.precio_mensual,
                                fotos: residence.fotos,
                                direccion: residence.direccion,
                                latitud: residence.latitud,
                                longitud: residence.longitud,
                                metodos_pago: residence.metodos_pago,
                                comodidades: residence.comodidades,
                                convivencia: residence.convivencia,
                                capacidad: residence.capacidad_total,
                                disponibilidad: residence.disponibilidad,
                                tipo_arrendatario: residence.tipo_arrendatario,

                                cantidad_hombres:
                                  residence.cantidad_hombres ?? 0,
                                cantidad_mujeres:
                                  residence.cantidad_mujeres ?? 0,
                              })
                            }
                          >
                            <Text style={styles.buttonText}>
                              Ver departamento
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginVertical: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      marginHorizontal: 10,
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <Text>← Anterior</Text>
                  </TouchableOpacity>

                  <Text>
                    Página {currentPage} de {totalPages}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      marginHorizontal: 10,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <Text>Siguiente →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default TenantViewScreen;
