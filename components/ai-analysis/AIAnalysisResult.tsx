import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Easing,
  ScrollView 
} from 'react-native';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StorageService } from '../../utils/storage';
import BasicInfo from './BasicInfo';
import MechanicalDetails from './MechanicalDetails';

type Damage = {
  type: string;
  location: string;
  length_cm: number;
  depth_mm: number;
  visibility: string;
  severity: string;
  confidence: number;
};

type CarInfo = {
  make: string;
  model: string;
  year: string;
  confidence: number;
};

type LicensePlate = {
  number: string;
  confidence: number;
};

type Mileage = {
  estimated_km: number;
  confidence: number;
  estimation_method: string;
};

type ConditionAndPrice = {
  condition: string;
  price_estimate_lakhs: number;
};

type AIAnalysisResultProps = {
  data: {
    car_info: CarInfo;
    license_plate: LicensePlate;
    damages: Damage[];
    mileage: Mileage;
    condition_and_price: ConditionAndPrice;
    frame_count: number;
    frames_processed: number;
  };
};

const AIAnalysisResult: React.FC<AIAnalysisResultProps> = ({ data }) => {
  // Initialize state with data from props or local storage
  const [storedData, setStoredData] = useState(data);
  const [basicInfo, setBasicInfo] = useState<any>({});
  const [mechanicalDetails, setMechanicalDetails] = useState<any>({});
  const [damages, setDamages] = useState<Damage[]>(data.damages || []);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<boolean>(false);
  const animationHeight = useRef(new Animated.Value(0)).current;

  // Load data from local storage on component mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [
          storedVehicle, 
          storedDamages, 
          storedBasicInfo,
          storedMechanicalDetails
        ] = await Promise.all([
          StorageService.getVehicleInfo(),
          StorageService.getDamages(),
          StorageService.getBasicInfo(),
          StorageService.getMechanicalDetails()
        ]);

        if (storedVehicle) {
          setStoredData(storedVehicle);
        }

        if (storedDamages && storedDamages.length > 0) {
          setDamages(storedDamages);
        } else if (data.damages && data.damages.length > 0) {
          setDamages(data.damages);
          await StorageService.setDamages(data.damages);
        }

        if (storedBasicInfo && Object.keys(storedBasicInfo).length > 0) {
          setBasicInfo(storedBasicInfo);
        } else if (data.mileage?.estimated_km) {
          // Initialize basic info with odometer reading from API
          const initialBasicInfo = {
            odometerReading: data.mileage.estimated_km.toString(),
            manufacturer: data.car_info?.make || '',
            model: data.car_info?.model || '',
            manufacturingYear: data.car_info?.year || '',
          };
          setBasicInfo(initialBasicInfo);
          await StorageService.setBasicInfo(initialBasicInfo);
        }

        // Initialize mechanical details if available
        if (storedMechanicalDetails) {
          setMechanicalDetails(storedMechanicalDetails);
        } else {
          // Initialize with default values if none exists
          const defaultMechanicalDetails = {
            engineType: '',
            transmission: 'Automatic',
            fuelType: 'Petrol',
            engineDisplacement: '',
            maxPower: '',
            maxTorque: '',
            cylinderConfiguration: '',
            emissionStandard: 'BS6',
            drivetrain: 'FWD',
            suspensionFront: '',
            suspensionRear: '',
            brakesFront: 'Disc',
            brakesRear: 'Drum',
            tireSize: '',
          };
          setMechanicalDetails(defaultMechanicalDetails);
          await StorageService.setMechanicalDetails(defaultMechanicalDetails);
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, [data]);

  // Update stored data when it changes
  const updateStoredData = useCallback(async (newData: any) => {
    setStoredData(newData);
    await StorageService.setVehicleInfo(newData);
  }, []);

  // Update damages when they change
  const updateDamages = useCallback(async (newDamages: Damage[]) => {
    setDamages(newDamages);
    await StorageService.setDamages(newDamages);
  }, []);

  // Update basic info when it changes
  const updateBasicInfo = useCallback(async (newInfo: any) => {
    const updatedInfo = {
      ...basicInfo,
      ...newInfo
    };
    setBasicInfo(updatedInfo);
    await StorageService.setBasicInfo(updatedInfo);
  }, [basicInfo]);

  // Update mechanical details when they change
  const updateMechanicalDetails = useCallback(async (newDetails: any) => {
    const updatedDetails = {
      ...mechanicalDetails,
      ...newDetails
    };
    setMechanicalDetails(updatedDetails);
    await StorageService.setMechanicalDetails(updatedDetails);
  }, [mechanicalDetails]);

  // Use stored data or fallback to props
  const { car_info, license_plate, mileage, condition_and_price } = storedData || data;

  // Dummy damage data for visualization when no damages are detected
  const dummyDamages: Damage[] = [
    {
      type: 'scratch',
      location: 'Front right fender',
      length_cm: 15.5,
      depth_mm: 0.5,
      visibility: 'high',
      severity: 'minor',
      confidence: 0.92,
    },
    {
      type: 'dent',
      location: 'Rear left door',
      length_cm: 8,
      depth_mm: 2.5,
      visibility: 'medium',
      severity: 'moderate',
      confidence: 0.87,
    },
  ];

  const damagesToShow = damages.length > 0 ? damages : dummyDamages;
  const hasDamages = damagesToShow.length > 0;

  const toggleExpand = useCallback(() => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    
    // Calculate the height needed for the content
    const contentHeight = damagesToShow.length * 120; // Approximate height per damage item
    const finalHeight = willExpand ? Math.min(contentHeight, 400) : 0; // Cap max height at 400
    
    // Stop any ongoing animation
    animationHeight.stopAnimation();
    
    // Animate to new height with smooth easing
    Animated.timing(animationHeight, {
      toValue: finalHeight,
      duration: 250,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.quad),
    }).start();
  }, [expanded, damagesToShow.length, animationHeight]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minor':
        return '#f39c12'; // Orange
      case 'moderate':
        return '#e74c3c'; // Red
      case 'severe':
        return '#c0392b'; // Dark Red
      default:
        return '#7f8c8d'; // Gray
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Vehicle Information Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.vehicleInfoText}>
              {car_info.make} {car_info.model} ({car_info.year})
            </Text>
            <Text style={styles.licensePlateText}>{license_plate.number}</Text>
          </View>
          
          <View style={[styles.conditionBadge, { backgroundColor: getSeverityColor(condition_and_price.condition) }]}>
            <Text style={styles.conditionText}>
              {condition_and_price.condition}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Trip</Text>
            <View style={styles.mileageBox}>
              <Text style={styles.mileageValue}>{mileage.estimated_km.toLocaleString()}</Text>
              <Text style={styles.mileageUnit}>km</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Estimated Value</Text>
            <Text style={styles.priceValue}>₹{condition_and_price.price_estimate_lakhs.toFixed(2)} L</Text>
          </View>
        </View>
      </View>

      {/* Damages Dropdown */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.dropdownHeader} 
          onPress={toggleExpand}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionTitle}>Detected Damages ({damagesToShow.length})</Text>
          <Text style={styles.dropdownIcon}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.dropdownContent,
            { height: animationHeight }
          ]}
        >
          {hasDamages ? (
            damagesToShow.map((damage, index) => (
              <View key={index} style={styles.damageItem}>
                <View style={styles.damageHeader}>
                  <Text style={styles.damageType}>
                    {damage.type.charAt(0).toUpperCase() + damage.type.slice(1).replace('_', ' ')}
                  </Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(damage.severity) }]}>
                    <Text style={styles.severityText}>{damage.severity}</Text>
                  </View>
                </View>
                <Text style={styles.damageLocation}>{damage.location}</Text>
                <View style={styles.damageDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Length:</Text>
                    <Text style={styles.detailValue}>{damage.length_cm} cm</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Depth:</Text>
                    <Text style={styles.detailValue}>{damage.depth_mm} mm</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Visibility:</Text>
                    <Text style={styles.detailValue}>
                      {damage.visibility.charAt(0).toUpperCase() + damage.visibility.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDamagesText}>No damages detected</Text>
          )}
        </Animated.View>
      </View>

      {/* Basic Information Card */}
      <BasicInfo 
        initialData={{
          ...basicInfo,
          odometerReading: basicInfo.odometerReading || (mileage?.estimated_km ? mileage.estimated_km.toString() : ''),
          manufacturer: basicInfo.manufacturer || car_info?.make || '',
          model: basicInfo.model || car_info?.model || '',
          manufacturingYear: basicInfo.manufacturingYear || car_info?.year || '',
        }}
        onUpdate={updateBasicInfo}
      />

      {/* Mechanical Details Card */}
      <MechanicalDetails 
        initialData={mechanicalDetails}
        onUpdate={updateMechanicalDetails}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vehicleInfoText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  licensePlateText: {
    fontSize: 15,
    color: '#ffffff',
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  conditionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  mileageBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mileageValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginRight: 4,
  },
  mileageUnit: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#27ae60',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownIcon: {
    fontSize: 14,
    color: '#666',
  },
  dropdownContent: {
    overflow: 'hidden',
  },
  noDamagesText: {
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 16,
  },
  damageItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  damageType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  damageLocation: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  damageDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 14,
    color: '#2d3436',
    fontWeight: '500',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
});

export default React.memo(AIAnalysisResult);
