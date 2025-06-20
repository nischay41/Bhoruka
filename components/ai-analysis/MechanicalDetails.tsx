import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { StorageService } from '../../utils/storage';

type MechanicalDetailsProps = {
  initialData?: {
    engineType: string;
    transmission: string;
    fuelType: string;
    fuelEfficiency: string;
    maxPower: string;
    maxTorque: string;
    engineDisplacement: string;
    cylinderConfiguration: string;
    emissionStandard: string;
    drivetrain: string;
    suspensionFront: string;
    suspensionRear: string;
    brakesFront: string;
    brakesRear: string;
    tireSize: string;
  };
  onUpdate?: (data: any) => void;
};

const MechanicalDetails: React.FC<MechanicalDetailsProps> = ({ initialData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    engineType: initialData?.engineType || '',
    transmission: initialData?.transmission || 'Automatic',
    fuelType: initialData?.fuelType || 'Petrol',
    fuelEfficiency: initialData?.fuelEfficiency || '',
    maxPower: initialData?.maxPower || '',
    maxTorque: initialData?.maxTorque || '',
    engineDisplacement: initialData?.engineDisplacement || '',
    cylinderConfiguration: initialData?.cylinderConfiguration || '',
    emissionStandard: initialData?.emissionStandard || 'BS6',
    drivetrain: initialData?.drivetrain || 'FWD',
    suspensionFront: initialData?.suspensionFront || '',
    suspensionRear: initialData?.suspensionRear || '',
    brakesFront: initialData?.brakesFront || 'Disc',
    brakesRear: initialData?.brakesRear || 'Drum',
    tireSize: initialData?.tireSize || '',
  });

  useEffect(() => {
    const loadData = async () => {
      const savedData = await StorageService.getMechanicalDetails();
      if (savedData) {
        setFormData(prev => ({
          ...prev,
          ...savedData,
          ...Object.fromEntries(
            Object.entries(savedData).filter(([_, v]) => v !== '')
          )
        }));
      }
    };
    loadData();
  }, []);

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Save to local storage
    StorageService.setMechanicalDetails(newData);
    
    // Notify parent component
    if (onUpdate) {
      onUpdate(newData);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const renderField = (label: string, field: keyof typeof formData, isEditable = true) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      {isEditing && isEditable ? (
        <TextInput
          style={styles.input}
          value={formData[field]}
          onChangeText={(text) => handleChange(field, text)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <Text style={styles.value}>{formData[field] || '-'}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Mechanical Details</Text>
        <Text 
          style={styles.editButton}
          onPress={toggleEdit}
        >
          {isEditing ? 'Save' : 'Edit'}
        </Text>
      </View>
      
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engine & Performance</Text>
          <View style={styles.row}>
            {renderField('Engine Type', 'engineType')}
            {renderField('Engine Displacement', 'engineDisplacement')}
          </View>
          <View style={styles.row}>
            {renderField('Max Power', 'maxPower')}
            {renderField('Max Torque', 'maxTorque')}
          </View>
          <View style={styles.row}>
            {renderField('Cylinder Configuration', 'cylinderConfiguration')}
            {renderField('Emission Standard', 'emissionStandard')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transmission & Drivetrain</Text>
          <View style={styles.row}>
            {renderField('Transmission', 'transmission')}
            {renderField('Drivetrain', 'drivetrain')}
          </View>
          <View style={styles.row}>
            {renderField('Fuel Type', 'fuelType')}
            {renderField('Fuel Efficiency', 'fuelEfficiency')}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suspension & Brakes</Text>
          <View style={styles.row}>
            {renderField('Front Suspension', 'suspensionFront')}
            {renderField('Rear Suspension', 'suspensionRear')}
          </View>
          <View style={styles.row}>
            {renderField('Front Brakes', 'brakesFront')}
            {renderField('Rear Brakes', 'brakesRear')}
          </View>
          <View style={styles.row}>
            {renderField('Tire Size', 'tireSize')}
            <View style={styles.fieldContainer} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  editButton: {
    color: '#3498db',
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#2d3436',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  input: {
    fontSize: 14,
    color: '#2d3436',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
});

export default MechanicalDetails;
