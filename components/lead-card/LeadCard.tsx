import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';

type Status = 'Pending' | 'Inspected' | 'Deal Done';

interface Lead {
  id: string;
  name: string;
  vehicle: string;
  regNumber: string;
  location: string;
  askingPrice: string;
  aiPrice?: string;
  status: Status;
}

interface LeadCardProps {
  lead: Lead;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  regNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  price: {
    fontSize: 14,
    color: '#333',
  },
  statusContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  pendingContainer: {
    backgroundColor: '#fffbe6',
  },
  pendingText: {
    color: '#f59e0b',
  },
  inspectedContainer: {
    backgroundColor: '#eef2ff',
  },
  inspectedText: {
    color: '#4f46e5',
  },
  dealDoneContainer: {
    backgroundColor: '#f0fdf4',
  },
  dealDoneText: {
    color: '#22c55e',
  },
  aiPriceContainer: {
    backgroundColor: '#eef2ff',
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  aiPriceLabel: {
    fontSize: 12,
    color: '#4f46e5',
    marginBottom: 2,
  },
  aiPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  callButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    justifyContent: 'center',
  },
  callButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#1e88e5',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  actionButtonGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});

const statusConfig: Record<Status, { 
    container: StyleProp<ViewStyle>; 
    text: StyleProp<TextStyle>; 
    icon: string; 
}> = {
    Pending: {
        container: styles.pendingContainer,
        text: styles.pendingText,
        icon: 'clock-outline',
    },
    Inspected: {
        container: styles.inspectedContainer,
        text: styles.inspectedText,
        icon: 'eye-check-outline',
    },
    'Deal Done': {
        container: styles.dealDoneContainer,
        text: styles.dealDoneText,
        icon: 'check-decagram-outline',
    },
};

const API_KEY = 'cai_AAeT5TJqcFpSaqLK6QeBgk3c9z9iBEI8dpF4aNTN8zWdokg3-OYzWrs_sW4QOZDLMtsH2FZ2Pf0gE6wCTd3FDQ';

const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const router = useRouter();
  const statusStyle = statusConfig[lead.status];

  const callSeller = async () => {
    try {
      // Step 1: Authenticate and obtain JWT
      const loginResp = await fetch('https://fastapi-server-1081098542602.us-central1.run.app/profiles/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': API_KEY,
        },
        body: JSON.stringify({
          email: 'ketan.demo@example.com',
          name: 'Demo User',
        }),
      });

      if (!loginResp.ok) {
        throw new Error(`Auth failed: ${loginResp.status}`);
      }

      const { access_token } = await loginResp.json();
      if (!access_token) {
        throw new Error('No access token returned');
      }

      // Step 2: Initiate SIP call
      const sipResp = await fetch('https://fastapi-server-1081098542602.us-central1.run.app/sip/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          name: lead.name,
          phone: '+917981564521',
          usecase_id: 'c4908121-d6ec-4fac-bf71-2769da7ed90d',
          email: 'ketan.demo@example.com',
        }),
      });

      if (!sipResp.ok) {
        throw new Error(`SIP call failed: ${sipResp.status}`);
      }

      Alert.alert('Success', 'SIP call initiated successfully');
    } catch (error) {
      console.error('Error initiating SIP call', error);
      Alert.alert('Error', 'Failed to initiate SIP call');
    }
  };

  const renderButtons = () => {
    switch (lead.status) {
      case 'Pending':
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.callButton} onPress={callSeller}>
              <Icon name="phone" size={16} color="#333" />
              <Text style={styles.callButtonText}>Call Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => router.push('/scan')}>
              <Icon name="camera-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Start Inspection</Text>
            </TouchableOpacity>
          </View>
        );
      case 'Inspected':
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.callButton} onPress={callSeller}>
              <Icon name="phone" size={16} color="#333" />
              <Text style={styles.callButtonText}>Call Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonGreen}>
              <Icon name="check-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Negotiate</Text>
            </TouchableOpacity>
          </View>
        );
      case 'Deal Done':
        return (
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.callButtonFull} onPress={callSeller}>
                    <Icon name="phone" size={16} color="#333" />
                    <Text style={styles.callButtonText}>Call Seller</Text>
                </TouchableOpacity>
            </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <View style={[styles.statusContainer, statusStyle.container]}>
          <Icon 
            name={statusStyle.icon}
            size={14} 
            color={(statusStyle.text as { color: string }).color} 
          />
          <Text style={[styles.statusText, statusStyle.text]}>{lead.status}</Text>
      </View>
      <Text style={styles.name}>{lead.name}</Text>
      <Text style={styles.vehicle}>{lead.vehicle}</Text>
      <Text style={styles.regNumber}>{lead.regNumber}</Text>
      <View style={styles.locationContainer}>
        <Icon name="map-marker-outline" size={16} color="#666" />
        <Text style={styles.location}>{lead.location}</Text>
      </View>
      <Text style={styles.price}>Asking Price: ₹{lead.askingPrice}</Text>
      {lead.aiPrice && (
        <View style={styles.aiPriceContainer}>
          <Text style={styles.aiPriceLabel}>AI Estimated Price:</Text>
          <Text style={styles.aiPrice}>₹{lead.aiPrice}</Text>
        </View>
      )}
      <View style={styles.separator} />
      {renderButtons()}
    </View>
  );
};

export default LeadCard;
