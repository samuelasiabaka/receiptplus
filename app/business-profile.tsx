import LoadingView from '@/components/loading-view';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
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
  const [websiteUri, setWebsiteUri] = useState('');
  const [customFooter, setCustomFooter] = useState('');

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
        setWebsiteUri(profile.websiteUri || '');
        setCustomFooter(profile.customFooter || '');
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
        websiteUri: websiteUri.trim() || undefined,
        customFooter: customFooter.trim() || undefined,
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
    return <LoadingView message="Loading profile..." />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E7EB', paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: '#F3F4F6' }]}>
          <IconSymbol size={20} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Business Profile</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Upload */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Logo</Text>
          <TouchableOpacity
            style={[logoUri ? styles.logoButtonWithImage : styles.logoButton, { borderColor: '#E5E7EB' }]}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
            ) : (
              <>
                <IconSymbol size={24} name="photo" color="#9CA3AF" />
                <Text style={[styles.logoButtonText, { color: '#9CA3AF' }]}>Upload Logo</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: '#9CA3AF' }]}>
            Recommended: Square image (1:1), max 2MB. Formats: PNG, JPEG, GIF, WebP
          </Text>
          {logoUri && (
            <TouchableOpacity
              onPress={() => setLogoUri(null)}
              style={styles.removeLogoButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.removeLogoText, { color: '#EF4444' }]}>Remove Logo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Business Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Business Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
            placeholder="Enter your business name"
            placeholderTextColor="#9CA3AF"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Phone Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
            placeholder="08012345678"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Address (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
            placeholder="123 Main Street"
            placeholderTextColor="#9CA3AF"
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
            style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
            placeholder="RC12345"
            placeholderTextColor="#9CA3AF"
            value={cacNumber}
            onChangeText={setCacNumber}
          />
        </View>

        {/* Website URI */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Website (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
            placeholder="https://example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            autoCapitalize="none"
            value={websiteUri}
            onChangeText={setWebsiteUri}
          />
        </View>

        {/* Custom Footer */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Custom Receipt Footer (Optional)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: colors.text }]}
            placeholder="Thank you for your patronage!"
            placeholderTextColor="#9CA3AF"
            value={customFooter}
            onChangeText={setCustomFooter}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={[styles.helperText, { color: '#9CA3AF' }]}>
            This text will appear at the bottom of your receipts. Leave empty to use default message.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: (!businessName.trim() || !phone.trim() || saving) ? '#D1D5DB' : '#2563EB' }
          ]}
          onPress={handleSave}
          disabled={!businessName.trim() || !phone.trim() || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  logoButton: {
    width: '100%',
    height: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  logoButtonWithImage: {
    width: '100%',
    height: 140,
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderRadius: 16,
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
    padding: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  textArea: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  helperText: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
    color: '#6B7280',
  },
});

