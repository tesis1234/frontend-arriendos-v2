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
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { Text } from "react-native-paper";
import Header from "../../components/Header";
import styles from "../../styles/LandlordViewScreenStyles";
import * as ImagePicker from "expo-image-picker";
import MapComponent from "../../components/MapComponent";
import Icon from "react-native-vector-icons/FontAwesome5";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import NotificationBanner from "../../components/NotificationBanner";
import NotificationService from "../../services/NotificationService";
import isEqual from "lodash.isequal";

const AdminDepartmentList = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [inputHeight, setInputHeight] = useState(0);
  const [images, setImages] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isEditing] = useState(false);
  const [imageIndices, setImageIndices] = useState({});
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get("window").width;
  const isWeb = Platform.OS === "web";
  const inputWidth = isWeb ? Math.min(screenWidth * 0.95, 600) : "100%";
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  const notificationsRef = useRef([]);
  const pollingIntervalRef = useRef(null);
  const mountedRef = useRef(true);

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
      setImages([...images, result.assets[0].uri]);
    }
  };

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://backend-arriendos-v2-production.up.railway.app/api/admin/departments"
      );

      if (response.data.length > 0) {
        setDepartments(response.data);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Error al cargar departamentos:", error);
      alert("No se pudieron cargar los departamentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchDepartments();
    }
  }, [fetchDepartments, user?.id]);

  const deleteDepartment = async (departmentId) => {
    try {
      const response = await axios.delete(
        `https://backend-arriendos-v2-production.up.railway.app/api/auth/departments/${departmentId}`
      );
      if (response.status === 200) {
        setDepartments((prev) =>
          prev.filter((department) => department.id !== departmentId)
        );
        alert("Departamento eliminado con éxito.");
        fetchDepartments();
      }
    } catch (error) {
      console.error("Error al eliminar el departamento:", error);
      alert("No se pudo eliminar el departamento.");
    }
  };
  const confirmDelete = (departmentId) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "¿Estás seguro de que deseas eliminar este departamento?"
      );
      if (confirmed) {
        deleteDepartment(departmentId);
      }
    } else {
      Alert.alert(
        "Confirmar eliminación",
        "¿Estás seguro de que deseas eliminar este departamento?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => deleteDepartment(departmentId),
          },
        ],
        { cancelable: true }
      );
    }
  };
  const loadNotifications = useCallback(async () => {
    try {
      const unreadNotifications =
        await NotificationService.getUnreadNotificationsLandlord(user?.id);
      const formattedNotifications = unreadNotifications.map((n) => {
        const data = JSON.parse(n.data ?? "{}");
        return {
          ...n,
          title: "Nueva solicitud de arriendo",
          message: `El inquilino ${
            data.tenantName ?? "desconocido"
          } está interesado en tu propiedad.`,
        };
      });

      if (!isEqual(formattedNotifications, notificationsRef.current)) {
        notificationsRef.current = formattedNotifications;
        if (mountedRef.current) {
          setNotifications(formattedNotifications);
          if (formattedNotifications.length > 0) {
            setCurrentNotification(formattedNotifications[0]);
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
    }, 3000);
  }, [loadNotifications, user?.id]);
  const handleNotificationPress = () => {
    if (currentNotification) {
      const notificationData = JSON.parse(currentNotification.data ?? "{}");
      navigation.navigate("RentalRequests", {
        notificationId: currentNotification.id_notificacion,
        propertyId: notificationData.propertyId,
        inquilino: {
          id: notificationData.tenantId,
          nombres: notificationData.tenantName?.split(" ")[0] ?? "",
          apellidos:
            notificationData.tenantName?.split(" ").slice(1).join(" ") ?? "",
          email: notificationData.tenantEmail,
          telefono: notificationData.tenantPhone,
          cedula: notificationData.tenantCedula,
        },
      });
      setShowNotification(false);
    }
  };

  const handleNotificationClose = () => {
    if (currentNotification) {
      NotificationService.markAsRead(currentNotification.id_notificacion);
      const updatedNotifications = notifications.filter(
        (n) => n.id_notificacion !== currentNotification.id_notificacion
      );
      setNotifications(updatedNotifications);
      notificationsRef.current = updatedNotifications;
      if (updatedNotifications.length > 0) {
        setCurrentNotification(updatedNotifications[0]);
        setShowNotification(true);
      } else {
        setCurrentNotification(null);
        setShowNotification(false);
      }
    }
  };
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      const timeoutId = setTimeout(() => {
        startPolling();
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [user?.id, loadNotifications, startPolling]);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
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
          <Text>Cargando...</Text> // Indicador de carga
        ) : departments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>Departamento sin registrar</Text>
          </View>
        ) : (
          <ScrollView
            style={isWeb ? styles.webScrollView : styles.flex}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <Header isLoggedIn={true} />

            {departments.map((department, index) => (
              <View key={index} style={styles.container}>
                <View style={styles.departmentContent}></View>
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
                        const fotosArray = JSON.parse(department.fotos || "[]");
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
                    <Text style={styles.title}>Departamento {index + 1}</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textAreaAuto,
                        { height: Math.max(40, inputHeight) },
                      ]}
                      value={department?.descripcion || ""}
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
                        $ {department?.precio_mensual || 0} al mes
                      </Text>
                      <Text style={styles.detailsText}>
                        {department?.tipo_arrendatario || ""}
                      </Text>
                      <Text style={styles.detailsText}>
                        {department?.cantidad_habitaciones || 0} Habitación(es)
                      </Text>
                      <Text style={styles.detailsText}>
                        {department?.cantidad_banos_individuales || 0} Baño(s)
                        Individual(es)
                      </Text>
                      <Text style={styles.detailsText}>
                        {department?.cantidad_salas || 0} Sala(s)
                      </Text>
                      <Text style={styles.detailsText}>
                        {department?.cantidad_parqueaderos || 0} Parqueadero(s)
                      </Text>
                    </View>

                    <View style={styles.detailsColumn}>
                      <Text style={styles.detailsText}>Forma de pago</Text>
                      <Text style={styles.detailsSubText}>
                        {department?.metodos_pago || ""}
                      </Text>
                      <Text style={styles.detailsText}>Comodidades</Text>
                      <Text style={styles.detailsSubText}>
                        {department?.comodidades || ""}
                      </Text>
                      <Text style={styles.detailsText}>Convivencia</Text>
                      <Text style={styles.detailsSubText}>
                        {department?.convivencia || ""}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsText}>
                    <Text style={styles.label}>Ubicación</Text>
                    <TextInput
                      style={styles.input}
                      value={department?.direccion || ""}
                      editable={false}
                      placeholder="Dirección no disponible"
                    />
                  </View>

                  <MapComponent
                    latitude={
                      isNaN(Number(department?.latitud))
                        ? -1.66355
                        : Number(department?.latitud)
                    }
                    longitude={
                      isNaN(Number(department?.longitud))
                        ? -78.654646
                        : Number(department?.longitud)
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
                      style={[styles.button, styles.register]}
                      onPress={() => {
                        console.log("department:", department);
                        console.log(
                          "Navegando a edición con ID:",
                          department.id_propiedad
                        );
                        navigation.navigate("AdminEditDepartment", {
                          departmentId: department.id_propiedad,
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

export default AdminDepartmentList;
