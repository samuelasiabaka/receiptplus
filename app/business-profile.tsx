import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getBusinessProfile, saveBusinessProfile } from '@/lib/storage';
import type { BusinessProfile } from '@/models/types';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getBusinessProfile();
      if (profile) {
        setBusinessName(profile.name);
        setPhone(profile.phone);
        setAddress(profile.address || '');
        setCacNumber(profile.cacNumber || '');
        setLogoUri(profile.logoUri || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Selected image URI:', selectedImage.uri);
        setLogoUri(selectedImage.uri);
        Alert.alert('Success', 'Logo selected. Tap "Save Profile" to save it.');
      } else if (result.canceled) {
        console.log('User canceled image picker');
      } else {
        console.log('No image selected');
        Alert.alert('No Image', 'No image was selected');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    try {
      setSaving(true);
      await saveBusinessProfile({
        name: businessName.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        cacNumber: cacNumber.trim() || undefined,
        logoUri: logoUri || undefined,
      });
      Alert.alert('Success', 'Business profile saved successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.tabIconDefault, paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Business Profile</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Logo Upload */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Logo</Text>
          <TouchableOpacity
            style={[logoUri ? styles.logoButtonWithImage : styles.logoButton, { borderColor: colors.tabIconDefault }]}
            onPress={handlePickImage}
          >
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
            ) : (
              <>
                <IconSymbol size={24} name="photo" color={colors.tabIconDefault} />
                <Text style={[styles.logoButtonText, { color: colors.tabIconDefault }]}>Upload Logo</Text>
              </>
            )}
          </TouchableOpacity>
          {logoUri && (
            <TouchableOpacity
              onPress={() => setLogoUri(null)}
              style={styles.removeLogoButton}
            >
              <Text style={[styles.removeLogoText, { color: '#EF4444' }]}>Remove Logo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Business Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Business Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
            placeholder="Enter your business name"
            placeholderTextColor={colors.tabIconDefault}
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
            placeholder="08012345678"
            placeholderTextColor={colors.tabIconDefault}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Address (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
            placeholder="123 Main Street"
            placeholderTextColor={colors.tabIconDefault}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* CAC Number */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>CAC Number (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
            placeholder="RC12345"
            placeholderTextColor={colors.tabIconDefault}
            value={cacNumber}
            onChangeText={setCacNumber}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.tabIconDefault, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.tint }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  logoButton: {
    width: '100%',
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoButtonWithImage: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  removeLogoButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  removeLogoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoButtonText: {
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

