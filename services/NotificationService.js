import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_BASE_URL = 'https://backend-arriendos-v2-production.up.railway.app';

// Configuración de notificaciones para móvil
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.initializeNotifications();
  }

  async initializeNotifications() {
    if (Platform.OS !== 'web') {
      // Solicitar permisos de notificación
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permisos de notificación denegados');
        return;
      }

      // Obtener token de notificación
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Token de notificación:', token);
      
      // Guardar token en el backend (si tienes un usuario logueado)
      // await this.saveTokenToBackend(token.data);
    }
  }

  // Enviar notificación de solicitud de alquiler
  async sendRentalRequestNotification(propertyOwnerId, tenantInfo, propertyInfo) {
    try {
      const notificationData = {
        recipientId: propertyOwnerId,
        senderId: tenantInfo.id,
        type: 'arriendo',
        title: 'Nueva solicitud de alquiler',
        message: `${tenantInfo.nombres} ${tenantInfo.apellidos} está interesado en tu propiedad "${propertyInfo.titulo}"`,
        data: {
          propertyId: propertyInfo.id,
          tenantId: tenantInfo.id,
          propertyTitle: propertyInfo.titulo,
          tenantName: `${tenantInfo.nombres} ${tenantInfo.apellidos}`,
          tenantEmail: tenantInfo.email,
          tenantPhone: tenantInfo.telefono,
          tenantCedula: tenantInfo.cedula,
        }
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/notifications/send`,
        notificationData
      );

      console.log('Notificación enviada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      throw error;
    }
  }

  // Obtener notificaciones del usuario
  async getUserNotifications(userId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/notifications/user/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId) {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  // Obtener notificaciones no leídas
  async getUnreadNotifications(userId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/notifications/user/${userId}/unread`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
      throw error;
    }
  }

  async getUnreadNotificationsLandlord(userId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/notifications/user/${userId}/unread/landlord`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
      throw error;
    }
  }

  // Escuchar notificaciones push en tiempo real (móvil)
  setupNotificationListener(callback) {
    if (Platform.OS !== 'web') {
      const subscription = Notifications.addNotificationReceivedListener(callback);
      return subscription;
    }
    return null;
  }

  // Manejar cuando se toca una notificación
  setupNotificationResponseListener(callback) {
    if (Platform.OS !== 'web') {
      const subscription = Notifications.addNotificationResponseReceivedListener(callback);
      return subscription;
    }
    return null;
  }

  // Mostrar notificación local (para testing)
  async showLocalNotification(title, body, data = {}) {
    if (Platform.OS !== 'web') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null,
      });
    }
  }
}

export default new NotificationService();