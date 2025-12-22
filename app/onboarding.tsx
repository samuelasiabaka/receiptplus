import LoadingView from '@/components/loading-view';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { saveBusinessProfile } from '@/lib/storage';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form data
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [websiteUri, setWebsiteUri] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  const colors = Colors[colorScheme ?? 'light'];

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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setLogoUri(selectedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      // Step 2: Business Name (required)
      if (!businessName.trim()) {
        Alert.alert('Required Field', 'Business name is required');
        return;
      }
    } else if (currentStep === 3) {
      // Step 3: Phone (required)
      if (!phone.trim()) {
        Alert.alert('Required Field', 'Phone number is required');
        return;
      }
    }

    if (currentStep < TOTAL_STEPS) {
      // Animate step transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
      // Animate step transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    // Validate required fields
    if (!businessName.trim()) {
      Alert.alert('Required Field', 'Business name is required');
      setCurrentStep(2);
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Phone number is required');
      setCurrentStep(3);
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
      
      // Navigate to home screen
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save business profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Animate step transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Logo (optional)
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <IconSymbol size={64} name="photo" color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Add Your Business Logo</Text>
            <Text style={[styles.stepDescription, { color: colors.tabIconDefault }]}>
              Upload your business logo to personalize your receipts. This is optional and can be added later.
            </Text>
            <TouchableOpacity
              style={[logoUri ? styles.logoButtonWithImage : styles.logoButton, { borderColor: colors.inputBorder }]}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
              ) : (
                <>
                  <IconSymbol size={32} name="photo" color="#9CA3AF" />
                  <Text style={[styles.logoButtonText, { color: '#9CA3AF' }]}>Tap to Upload Logo</Text>
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
        );

      case 2:
        // Step 2: Business Name (required)
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <IconSymbol size={64} name="doc.text.fill" color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Business Name</Text>
            <Text style={[styles.stepDescription, { color: colors.tabIconDefault }]}>
              Enter your business name. This will appear on all your receipts.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Enter your business name"
              placeholderTextColor={colors.tabIconDefault}
              value={businessName}
              onChangeText={setBusinessName}
              returnKeyType="next"
              onSubmitEditing={handleNext}
              autoFocus
            />
          </View>
        );

      case 3:
        // Step 3: Phone (required)
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <IconSymbol size={64} name="paperplane.fill" color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Phone Number</Text>
            <Text style={[styles.stepDescription, { color: colors.tabIconDefault }]}>
              Enter your business phone number. This will be displayed on your receipts.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="08012345678"
              placeholderTextColor={colors.tabIconDefault}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              returnKeyType="next"
              onSubmitEditing={handleNext}
              autoFocus
            />
          </View>
        );

      case 4:
        // Step 4: Address, CAC, Website (all optional)
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <IconSymbol size={64} name="gearshape.fill" color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Additional Information</Text>
            <Text style={[styles.stepDescription, { color: colors.tabIconDefault }]}>
              Add optional details about your business. You can skip this step or fill in any fields you want.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Address (Optional)"
              placeholderTextColor={colors.tabIconDefault}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
              returnKeyType="next"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text, marginTop: 12 }]}
              placeholder="CAC Number (Optional)"
              placeholderTextColor={colors.tabIconDefault}
              value={cacNumber}
              onChangeText={setCacNumber}
              returnKeyType="next"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text, marginTop: 12 }]}
              placeholder="Website (Optional)"
              placeholderTextColor={colors.tabIconDefault}
              keyboardType="url"
              autoCapitalize="none"
              value={websiteUri}
              onChangeText={setWebsiteUri}
              returnKeyType="done"
            />
          </View>
        );

      case 5:
        // Step 5: Custom Footer (optional)
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <IconSymbol size={64} name="doc.text.fill" color={colors.tint} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Receipt Footer Message</Text>
            <Text style={[styles.stepDescription, { color: colors.tabIconDefault }]}>
              Add a custom message that will appear at the bottom of your receipts. Leave empty to use the default message.
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Thank you for your patronage!"
              placeholderTextColor={colors.tabIconDefault}
              value={customFooter}
              onChangeText={setCustomFooter}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
            />
          </View>
        );

      default:
        return null;
    }
  };

  const isOptionalStep = currentStep === 1 || currentStep === 4 || currentStep === 5;
  const canProceed = currentStep === 1 || currentStep === 4 || currentStep === 5 || 
                     (currentStep === 2 && businessName.trim()) ||
                     (currentStep === 3 && phone.trim());

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.cardBackground, paddingTop: insets.top + 16 }]}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${(currentStep / TOTAL_STEPS) * 100}%`, backgroundColor: colors.tint }]} />
        </View>
        <Text style={[styles.progressText, { color: '#6B7280' }]}>
          Step {currentStep} of {TOTAL_STEPS}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          {renderStepContent()}
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.inputBorder, backgroundColor: colors.cardBackground, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <IconSymbol size={20} name="chevron.left" color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.rightButtons}>
            {isOptionalStep && (
              <TouchableOpacity
                style={[styles.skipButton, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder }]}
                onPress={handleSkip}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipButtonText, { color: colors.text }]}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                { backgroundColor: canProceed && !saving ? colors.tint : '#D1D5DB' }
              ]}
              onPress={handleNext}
              disabled={!canProceed || saving}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === TOTAL_STEPS ? (saving ? 'Saving...' : 'Complete') : 'Next'}
              </Text>
              {currentStep < TOTAL_STEPS && (
                <IconSymbol size={20} name="chevron.right" color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    flexGrow: 1,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
    color: '#6B7280',
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 52,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  logoButton: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  logoButtonWithImage: {
    width: 220,
    height: 220,
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
  logoButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  removeLogoButton: {
    marginTop: 16,
  },
  removeLogoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  skipButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    paddingHorizontal: 28,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

