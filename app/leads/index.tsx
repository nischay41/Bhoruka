import { Stack } from 'expo-router';
import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import LeadCard from '../../components/lead-card/LeadCard';
import Icon from 'react-native-vector-icons/Ionicons';

const leads = [
  {
    id: '1',
    name: 'Ram Yadav',
    vehicle: 'Tata 407 (2018)',
    regNumber: 'MH20GH3456',
    location: 'Aurangabad, Maharashtra',
    askingPrice: '3,50,000',
    status: 'Pending',
  },
  {
    id: '2',
    name: 'Suresh Kumar',
    vehicle: 'Eicher Pro 1049 (2020)',
    regNumber: 'KA29IJ7890',
    location: 'Hubli, Karnataka',
    askingPrice: '4,80,000',
    aiPrice: '4,20,000 - 4,60,000',
    status: 'Inspected',
  },
  {
    id: '3',
    name: 'Prakash Singh',
    vehicle: 'Force Traveller (2017)',
    regNumber: 'RJ14KL2345',
    location: 'Jaipur, Rajasthan',
    askingPrice: '2,80,000',
    status: 'Deal Done',
  },
];

const NewLeadsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#1e88e5' },
          headerTintColor: '#fff',
          headerTitle: 'New Leads',
          headerLeft: () => (
            <TouchableOpacity onPress={() => {}} style={{ marginLeft: 10 }}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        data={leads}
        renderItem={({ item }) => <LeadCard lead={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  list: {
    padding: 16,
  },
});

export default NewLeadsScreen;
