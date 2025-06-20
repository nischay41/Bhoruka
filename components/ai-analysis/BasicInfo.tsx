import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { StorageService } from '../../utils/storage';

type BasicInfoProps = {
  initialData?: {
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
  onUpdate?: (data: any) => void;
};

const BasicInfo: React.FC<BasicInfoProps> = ({ initialData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: initialData?.registrationNumber || '',
    registrationDate: initialData?.registrationDate || '',
    engineNumber: initialData?.engineNumber || '',
    chassisNumber: initialData?.chassisNumber || '',
    ownerName: initialData?.ownerName || '',
    fitnessUpto: initialData?.fitnessUpto || '',
    fuelType: initialData?.fuelType || 'Petrol',
    vehicleClass: initialData?.vehicleClass || 'M1',
    manufacturer: initialData?.manufacturer || '',
    model: initialData?.model || '',
    manufacturingYear: initialData?.manufacturingYear || '',
    odometerReading: initialData?.odometerReading || '',
  });

  useEffect(() => {
    const loadData = async () => {
      const savedData = await StorageService.getBasicInfo();
      if (savedData) {
        setFormData(prev => ({
          ...prev,
          ...savedData,
          // Don't override with empty values
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
    StorageService.setBasicInfo(newData);
    
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
        <Text style={styles.title}>Basic Information</Text>
        <Text 
          style={styles.editButton}
          onPress={toggleEdit}
        >
          {isEditing ? 'Save' : 'Edit'}
        </Text>
      </View>
      
      <ScrollView>
        <View style={styles.row}>
          {renderField('Registration Number', 'registrationNumber')}
          {renderField('Registration Date', 'registrationDate')}
        </View>
        
        <View style={styles.row}>
          {renderField('Engine Number', 'engineNumber')}
          {renderField('Chassis Number', 'chassisNumber')}
        </View>
        
        <View style={styles.row}>
          {renderField('Owner Name', 'ownerName')}
          {renderField('Fitness Upto', 'fitnessUpto')}
        </View>
        
        <View style={styles.row}>
          {renderField('Fuel Type', 'fuelType')}
          {renderField('Vehicle Class', 'vehicleClass')}
        </View>
        
        <View style={styles.row}>
          {renderField('Manufacturer', 'manufacturer')}
          {renderField('Model', 'model')}
        </View>
        
        <View style={styles.row}>
          {renderField('Manufacturing Year', 'manufacturingYear')}
          {renderField('Odometer Reading (km)', 'odometerReading')}
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
    maxHeight: 500,
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

export default BasicInfo;
