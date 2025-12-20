import LoadingView from '@/components/loading-view';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
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
              style={[logoUri ? styles.logoButtonWithImage : styles.logoButton, { borderColor: colors.tabIconDefault }]}
              onPress={handlePickImage}
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
              ) : (
                <>
                  <IconSymbol size={32} name="photo" color={colors.tabIconDefault} />
                  <Text style={[styles.logoButtonText, { color: colors.tabIconDefault }]}>Tap to Upload Logo</Text>
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
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
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
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
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
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
              placeholder="Address (Optional)"
              placeholderTextColor={colors.tabIconDefault}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
              returnKeyType="next"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text, marginTop: 12 }]}
              placeholder="CAC Number (Optional)"
              placeholderTextColor={colors.tabIconDefault}
              value={cacNumber}
              onChangeText={setCacNumber}
              returnKeyType="next"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text, marginTop: 12 }]}
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
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
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
      <View style={[styles.progressContainer, { paddingTop: insets.top + 16 }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / TOTAL_STEPS) * 100}%`, backgroundColor: colors.tint }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.tabIconDefault }]}>
          Step {currentStep} of {TOTAL_STEPS}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.tabIconDefault, backgroundColor: colors.background }]}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
              onPress={handleBack}
            >
              <IconSymbol size={20} name="chevron.left" color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.rightButtons}>
            {isOptionalStep && (
              <TouchableOpacity
                style={[styles.skipButton, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
                onPress={handleSkip}
                disabled={saving}
              >
                <Text style={[styles.skipButtonText, { color: colors.text }]}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                { backgroundColor: canProceed && !saving ? colors.tint : colors.tabIconDefault }
              ]}
              onPress={handleNext}
              disabled={!canProceed || saving}
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
    padding: 16,
    paddingBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
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
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  logoButton: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  logoButtonWithImage: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 12,
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
    padding: 16,
    borderTopWidth: 1,
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
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  skipButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

