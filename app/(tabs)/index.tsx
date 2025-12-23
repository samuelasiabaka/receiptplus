import LoadingView from '@/components/loading-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDb } from '@/lib/database';
import { deleteReceipt, getAllReceipts } from '@/lib/storage';
import type { Receipt } from '@/models/types';
import { formatCurrency, formatDate } from '@/utils/receipt';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Animated Receipt Card Component
function AnimatedReceiptCard({
  receipt,
  index,
  colors,
  formatDate,
  formatCurrency,
  onPress,
  onDelete,
}: {
  receipt: Receipt;
  index: number;
  colors: any;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
  onPress: () => void;
  onDelete: (e: any) => void;
}) {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const opacity = cardAnim;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity
        style={[styles.receiptCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.receiptCardHeader}>
          <View style={styles.receiptCardInfo}>
            <Text style={[styles.receiptNumber, { color: colors.text }]}>{receipt.receiptNumber}</Text>
            <Text style={[styles.receiptDate, { color: colors.tabIconDefault }]}>
              {formatDate(receipt.createdAt)}
            </Text>
          </View>
          <View style={[styles.totalBadge, { backgroundColor: `${colors.tint}15` }]}>
            <Text style={[styles.receiptTotal, { color: colors.tint }]}>
              {formatCurrency(receipt.total)}
            </Text>
          </View>
        </View>
        <View style={[styles.receiptCardFooter, { borderTopColor: colors.inputBorder }]}>
          <View style={[styles.itemsBadge, { backgroundColor: colors.background }]}>
            <IconSymbol size={14} name="doc.text.fill" color={colors.tabIconDefault} />
            <Text style={[styles.receiptItemsCount, { color: colors.tabIconDefault }]}>
              {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {receipt.id && (
            <TouchableOpacity
              onPress={onDelete}
              style={[styles.deleteButton, { backgroundColor: '#FEF2F2' }]}
              activeOpacity={0.7}
            >
              <IconSymbol size={16} name="trash.fill" color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadReceipts = async () => {
    try {
      // Ensure database schema exists before querying
      await initDb();
      const allReceipts = await getAllReceipts();
      setReceipts(allReceipts);
      
      // Animate fade-in
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
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

  // Refresh receipts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [])
  );

  const handleCreateReceipt = () => {
    router.push('/create-receipt');
  };

  const handleOpenSettings = () => {
    router.push('/business-profile');
  };

  const handleOpenInventory = () => {
    router.push('/inventory' as any);
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
      <View style={[styles.header, { backgroundColor: colors.cardBackground, paddingTop: insets.top + 16, borderBottomColor: colors.inputBorder }]}>
        <View style={styles.headerContent}>
        <Text style={[styles.title, { color: colors.text }]}>My Receipts</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={handleOpenInventory} 
              style={[styles.headerButton, { backgroundColor: colors.background }]}
            >
              <IconSymbol size={20} name="cube.box.fill" color={colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleOpenSettings} 
              style={[styles.headerButton, { backgroundColor: colors.background }]}
            >
              <IconSymbol size={20} name="gearshape.fill" color={colors.tint} />
        </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingView message="Loading receipts..." />
        ) : receipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.background }]}>
            <Text style={styles.emptyEmoji}>📋</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No receipts yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
              Create your first receipt to get started
            </Text>
          </View>
        ) : (
          <Animated.View style={[styles.receiptsList, { opacity: fadeAnim }]}>
            {receipts.map((receipt, index) => (
              <AnimatedReceiptCard
                key={receipt.id}
                receipt={receipt}
                index={index}
                colors={colors}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                onPress={() => receipt.id && handleReceiptPress(receipt.id)}
                onDelete={(e) => receipt.id && handleDeleteReceipt(receipt.id!, e)}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.inputBorder, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateReceipt}
          activeOpacity={0.8}
        >
          <View style={styles.createButtonContent}>
            <IconSymbol size={22} name="plus" color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Receipt</Text>
          </View>
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  receiptsList: {
    gap: 16,
  },
  receiptCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  receiptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  receiptCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  receiptNumber: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  receiptDate: {
    fontSize: 13,
    lineHeight: 18,
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'flex-end',
  },
  receiptTotal: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  receiptCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  itemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  receiptItemsCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  createButton: {
    borderRadius: 14,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
