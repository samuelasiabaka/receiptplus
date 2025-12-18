import ReceiptView from '@/components/receipt-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getBusinessProfile, getReceiptById } from '@/lib/storage';
import type { BusinessProfile, Receipt } from '@/models/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

export default function ReceiptPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const receiptRef = useRef<View>(null);
  
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      const receiptId = parseInt(params.id as string);
      if (isNaN(receiptId)) {
        Alert.alert('Error', 'Invalid receipt ID');
        router.back();
        return;
      }

      const [receiptData, profileData] = await Promise.all([
        getReceiptById(receiptId),
        getBusinessProfile(),
      ]);

      if (!receiptData) {
        Alert.alert('Error', 'Receipt not found');
        router.back();
        return;
      }

      if (!profileData) {
        Alert.alert(
          'Business Profile Required',
          'Please set up your business profile first',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
            {
              text: 'Go to Settings',
              onPress: () => router.push('/business-profile'),
            },
          ]
        );
        return;
      }

      setReceipt(receiptData);
      setBusinessProfile(profileData);
    } catch (error) {
      console.error('Error loading receipt:', error);
      Alert.alert('Error', 'Failed to load receipt');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!receipt || !businessProfile) return;

    try {
      setSharing(true);

      // Capture receipt as image
      if (receiptRef.current) {
        const fileUri = await captureRef(receiptRef.current, {
          format: 'png',
          quality: 0.9,
        });

        // Use native share sheet - user can select WhatsApp
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: 'Share receipt',
            UTI: 'public.png',
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleEdit = () => {
    // Navigate back to create receipt with current receipt data
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading receipt...</Text>
      </View>
    );
  }

  if (!receipt || !businessProfile) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Receipt not found</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.tint }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.tabIconDefault, paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Receipt</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Receipt Preview */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View ref={receiptRef} collapsable={false} style={styles.receiptWrapper}>
          <ReceiptView receipt={receipt} businessProfile={businessProfile} />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.tabIconDefault, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.tint }]}
          onPress={handleShareWhatsApp}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol size={20} name="square.and.arrow.up" color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share to WhatsApp</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
            onPress={handleEdit}
          >
            <IconSymbol size={20} name="pencil" color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit</Text>
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
  backButtonHeader: {
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
    alignItems: 'center',
    width: '100%',
  },
  receiptWrapper: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignSelf: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

