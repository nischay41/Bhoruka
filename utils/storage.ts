import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  VEHICLE_INFO: '@vehicle_info',
  DAMAGES: '@damages',
  BASIC_INFO: '@basic_info',
  MECHANICAL_DETAILS: '@mechanical_details'
};

type BasicInfo = {
  registrationNumber: string;
  registrationDate: string;
  engineNumber: string;
  chassisNumber: string;
  ownerName: string;
  fitnessUpto: string;
  fuelType: string;
  vehicleClass: string;
  manufacturer: string;
  model: string;
  manufacturingYear: string;
  odometerReading: string;
};

export const StorageService = {
  // Vehicle Info
  async getVehicleInfo() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.VEHICLE_INFO);
    return data ? JSON.parse(data) : null;
  },

  async setVehicleInfo(info: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.VEHICLE_INFO, JSON.stringify(info));
  },

  // Damages
  async getDamages() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAMAGES);
    return data ? JSON.parse(data) : [];
  },

  async setDamages(damages: any[]) {
    await AsyncStorage.setItem(STORAGE_KEYS.DAMAGES, JSON.stringify(damages));
  },

  // Basic Info
  async getBasicInfo(): Promise<Partial<BasicInfo>> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BASIC_INFO);
    return data ? JSON.parse(data) : {};
  },

  async setBasicInfo(info: Partial<BasicInfo>) {
    const currentInfo = await this.getBasicInfo();
    await AsyncStorage.setItem(
      STORAGE_KEYS.BASIC_INFO, 
      JSON.stringify({ ...currentInfo, ...info })
    );
  },

  // Mechanical Details
  async getMechanicalDetails() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MECHANICAL_DETAILS);
    return data ? JSON.parse(data) : null;
  },

  async setMechanicalDetails(details: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.MECHANICAL_DETAILS, JSON.stringify(details));
  },

  // Clear all data (for testing)
  async clearAll() {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  }
};
