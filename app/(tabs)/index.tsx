import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDb } from '@/lib/database';
import { deleteReceipt, getAllReceipts } from '@/lib/storage';
import type { Receipt } from '@/models/types';
import { formatCurrency, formatDate } from '@/utils/receipt';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReceipts = async () => {
    try {
      // Ensure database schema exists before querying
      await initDb();
      const allReceipts = await getAllReceipts();
      setReceipts(allReceipts);
    } catch (error) {
      console.error('Error loading receipts:', error);
      Alert.alert('Error', 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  const handleCreateReceipt = () => {
    router.push('/create-receipt');
  };

  const handleOpenSettings = () => {
    router.push('/business-profile');
  };

  const handleReceiptPress = (receiptId: number) => {
    router.push(`/receipt-preview?id=${receiptId}`);
  };

  const handleDeleteReceipt = async (receiptId: number, event: any) => {
    event?.stopPropagation();
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReceipt(receiptId);
              await loadReceipts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.tabIconDefault, paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>My Receipts</Text>
        <TouchableOpacity onPress={handleOpenSettings} style={styles.settingsButton}>
          <IconSymbol size={24} name="gearshape.fill" color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>Loading...</Text>
          </View>
        ) : receipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No receipts yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
              Create your first receipt to get started
            </Text>
          </View>
        ) : (
          <View style={styles.receiptsList}>
            {receipts.map((receipt) => (
              <TouchableOpacity
                key={receipt.id}
                style={[styles.receiptCard, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
                onPress={() => receipt.id && handleReceiptPress(receipt.id)}
              >
                <View style={styles.receiptCardHeader}>
                  <View style={styles.receiptCardInfo}>
                    <Text style={[styles.receiptNumber, { color: colors.text }]}>{receipt.receiptNumber}</Text>
                    <Text style={[styles.receiptDate, { color: colors.tabIconDefault }]}>
                      {formatDate(receipt.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.receiptTotal, { color: colors.tint }]}>
                    {formatCurrency(receipt.total)}
                  </Text>
                </View>
                <View style={styles.receiptCardFooter}>
                  <Text style={[styles.receiptItemsCount, { color: colors.tabIconDefault }]}>
                    {receipt.items.length} item(s)
                  </Text>
                  {receipt.id && (
                    <TouchableOpacity
                      onPress={(e) => handleDeleteReceipt(receipt.id!, e)}
                      style={styles.deleteButton}
                    >
                      <IconSymbol size={16} name="trash.fill" color={colors.tabIconDefault} />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={[styles.footer, { borderTopColor: colors.tabIconDefault, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateReceipt}
        >
          <IconSymbol size={20} name="plus" color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  receiptsList: {
    gap: 12,
  },
  receiptCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  receiptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  receiptCardInfo: {
    flex: 1,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
  },
  receiptTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  receiptCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptItemsCount: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    backgroundColor: '#2563EB', // Brand Primary color - Tech Blue
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
