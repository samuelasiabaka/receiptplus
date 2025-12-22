import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { markHelpGuideAsSeen } from '@/lib/storage';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;

interface HelpStep {
  icon: string;
  title: string;
  description: string;
  details: string[];
}

const helpSteps: HelpStep[] = [
  {
    icon: 'doc.text.fill',
    title: 'Create Receipts',
    description: 'Generate professional receipts in seconds',
    details: [
      'Tap the "Create Receipt" button',
      'Enter customer name (required)',
      'Add items with quantity and price',
      'Tap "Generate Receipt" when done',
      'Share via WhatsApp instantly'
    ]
  },
  {
    icon: 'cube.box.fill',
    title: 'Manage Inventory',
    description: 'Save items for quick access',
    details: [
      'Go to Inventory from the home screen',
      'Add items you sell regularly',
      'Search items when creating receipts',
      'Select from your saved items',
      'Saves time on repeated entries'
    ]
  },
  {
    icon: 'gearshape.fill',
    title: 'Business Profile',
    description: 'Customize your business information',
    details: [
      'Add your business logo',
      'Set business name and phone',
      'Add address and CAC number',
      'Customize receipt footer message',
      'All info appears on receipts automatically'
    ]
  },
  {
    icon: 'doc.text.magnifyingglass',
    title: 'View Receipts',
    description: 'Access your receipt history',
    details: [
      'All receipts saved automatically',
      'Tap any receipt to view details',
      'Edit receipts anytime',
      'Delete receipts you no longer need',
      'All data stored locally on your device'
    ]
  },
  {
    icon: 'checkmark.circle.fill',
    title: 'You\'re All Set!',
    description: 'Start creating professional receipts',
    details: [
      'Everything works offline',
      'No internet needed',
      'Share receipts via WhatsApp',
      'Perfect for Nigerian businesses',
      'Simple and easy to use'
    ]
  }
];

export default function HelpGuideScreen({ onComplete, showSkip = true }: { onComplete?: () => void; showSkip?: boolean }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    // Animate slide on step change
    Animated.parallel([
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
      ]),
      Animated.spring(slideAnim, {
        toValue: currentStep,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Mark guide as seen
    try {
      await markHelpGuideAsSeen();
    } catch (error) {
      console.error('Error marking help guide as seen:', error);
    }

    if (onComplete) {
      onComplete();
    } else {
      router.back();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentStepData = helpSteps[currentStep];
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, paddingTop: insets.top + 16, borderBottomColor: colors.inputBorder }]}>
        <View style={styles.headerContent}>
          {showSkip ? (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipButtonText, { color: colors.tabIconDefault }]}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.background }]}>
              <IconSymbol size={24} name="chevron.left" color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>Help Guide</Text>
          <View style={styles.placeholder} />
        </View>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: '#E5E7EB' }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: colors.tint,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.tabIconDefault }]}>
            {currentStep + 1} of {TOTAL_STEPS}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${colors.tint}15` }]}>
            <IconSymbol size={64} name={currentStepData.icon as any} color={colors.tint} />
          </View>

          {/* Title */}
          <Text style={[styles.stepTitle, { color: colors.text }]}>{currentStepData.title}</Text>

          {/* Description */}
          <Text style={[styles.stepDescription, { color: colors.tabIconDefault }]}>
            {currentStepData.description}
          </Text>

          {/* Details List */}
          <View style={styles.detailsContainer}>
            {currentStepData.details.map((detail, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={[styles.detailBullet, { backgroundColor: colors.tint }]} />
                <Text style={[styles.detailText, { color: colors.text }]}>{detail}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.inputBorder, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.buttonRow}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.backButtonFooter, { backgroundColor: colors.background, borderColor: colors.inputBorder }]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <IconSymbol size={20} name="chevron.left" color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.tint },
              currentStep === 0 && styles.nextButtonFullWidth,
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === TOTAL_STEPS - 1 ? 'Get Started' : 'Next'}
            </Text>
            {currentStep < TOTAL_STEPS - 1 && (
              <IconSymbol size={20} name="chevron.right" color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 60,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  stepContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
    color: '#6B7280',
  },
  detailsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingRight: 20,
  },
  detailBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
    gap: 12,
  },
  backButtonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    flex: 1,
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

