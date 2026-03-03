import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import Header from "../../components/Header";
import axios from "axios";

const screenWidth = Dimensions.get("window").width;

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    usuarios: 0,
    residencias: 0,
    departamentos: 0,
    contratos: 0,
    contratosActivos: 0,
    ocupacion: 0,
  });
  const [usuariosPorMes, setUsuariosPorMes] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usuariosRes, propiedadesRes, arriendosRes] = await Promise.all([
        axios.get("https://backend-arriendos-v2-production.up.railway.app/api/admin/usuarios/count"),
        axios.get("https://backend-arriendos-v2-production.up.railway.app/api/admin/propiedades/count"),
        axios.get("https://backend-arriendos-v2-production.up.railway.app/api/admin/arriendos/count"),
      ]);

      const usuarios = usuariosRes.data.total || 0;
      const residencias = propiedadesRes.data.residencias || 0;
      const departamentos = propiedadesRes.data.departamentos || 0;
      const contratos = arriendosRes.data.total || 0;
      const contratosActivos = arriendosRes.data.activos || 0;
      
      const ocupacion = propiedadesRes.data.ocupacion || 0;
      const usuariosMesRes = await axios.get(
        "https://backend-arriendos-v2-production.up.railway.app/api/admin/usuarios/por-mes"
      );
      setUsuariosPorMes(usuariosMesRes.data);

      setStats({
        usuarios,
        residencias,
        departamentos,
        contratos,
        contratosActivos,
        
        ocupacion,
      });
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header isLoggedIn={true} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcomeText}>Bienvenido, Administrador</Text>

        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => navigation.navigate("AdminUsersList")}
          >
            <Text style={styles.navItem}>Usuarios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("AdminResidencesList")}
          >
            <Text style={styles.navItem}>Residencias</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("AdminDepartmentList")}
          >
            <Text style={styles.navItem}>Departamentos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("AdminContractsList")}
          >
            <Text style={styles.navItem}>Contratos</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard numérico */}
        <View style={styles.dashboardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Usuarios</Text>
            <Text style={styles.cardNumber}>{stats.usuarios}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Residencias</Text>
            <Text style={styles.cardNumber}>{stats.residencias}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Departamentos</Text>
            <Text style={styles.cardNumber}>{stats.departamentos}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Contratos</Text>
            <Text style={styles.cardNumber}>{stats.contratos}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activos</Text>
            <Text style={styles.cardNumber}>{stats.contratosActivos}</Text>
          </View>


          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ocupación</Text>
            <Text style={styles.cardNumber}>{stats.ocupacion}%</Text>
          </View>
        </View>

        {/* Gráficas */}
        <Text style={styles.sectionTitle}>Estadísticas Visuales</Text>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            Crecimiento de Usuarios Registrados
          </Text>
          <Text style={styles.chartSubtitle}>
            Eje X: Meses — Eje Y: Cantidad de Usuarios
          </Text>

          <LineChart
            data={{
              labels: [
                "Ene",
                "Feb",
                "Mar",
                "Abr",
                "May",
                "Jun",
                "Jul",
                "Ago",
                "Sep",
                "Oct",
                "Nov",
                "Dic",
              ],
              datasets: [{ data: usuariosPorMes }],
            }}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Ocupación Actual del Sistema</Text>
          <Text style={styles.chartSubtitle}>
            Proporción entre propiedades ocupadas y disponibles
          </Text>

          <PieChart
            data={[
              {
                name: "Ocupados",
                population: stats.ocupacion,
                color: "#3498db",
              },
              {
                name: "Disponibles",
                population: 100 - stats.ocupacion,
                color: "#95a5a6",
              },
            ]}
            width={screenWidth - 60}
            height={220}
            accessor={"population"}
            chartConfig={chartConfig}
            backgroundColor={"transparent"}
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const chartConfig = {
  backgroundColor: "#fff",
  backgroundGradientFrom: "#f5f5f5",
  backgroundGradientTo: "#f5f5f5",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  welcomeText: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#0d6a05ff",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 25,
  },
  navItem: { color: "#fff", fontSize: 16, fontWeight: "600" },
  dashboardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },

  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },

  chartSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
    textAlign: "center",
  },

  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardNumber: { fontSize: 20, fontWeight: "bold", marginTop: 10 },
  chartWrapper: { alignItems: "center", marginVertical: 10 },
  chart: { borderRadius: 10 },
});

export default AdminDashboardScreen;
