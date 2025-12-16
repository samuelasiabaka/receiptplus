import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getReceiptById } from '@/lib/storage';
import { getBusinessProfile } from '@/lib/storage';
import type { Receipt, BusinessProfile } from '@/models/types';
import ReceiptView from '@/components/receipt-view';
import { formatReceiptText } from '@/utils/receipt';
import * as Linking from 'expo-linking';

export default function ReceiptPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
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

        // Share via WhatsApp (through the native share sheet)
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent('Receipt attached')}`;
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        
        if (canOpen) {
          // Try to share the image file
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'image/png',
              dialogTitle: 'Share receipt via WhatsApp',
            });
          } else {
            // Fallback: share as text
            const receiptText = formatReceiptText(receipt, businessProfile);
            const textUrl = `whatsapp://send?text=${encodeURIComponent(receiptText)}`;
            await Linking.openURL(textUrl);
          }
        } else {
          // Fallback: share as text
          const receiptText = formatReceiptText(receipt, businessProfile);
          const textUrl = `whatsapp://send?text=${encodeURIComponent(receiptText)}`;
          await Linking.openURL(textUrl);
        }
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      // Fallback: share as text
      if (receipt && businessProfile) {
        const receiptText = formatReceiptText(receipt, businessProfile);
        const textUrl = `whatsapp://send?text=${encodeURIComponent(receiptText)}`;
        await Linking.openURL(textUrl);
      }
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
      <View style={[styles.header, { borderBottomColor: colors.tabIconDefault }]}>
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
  },
  receiptWrapper: {
    backgroundColor: '#FFFFFF',
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

