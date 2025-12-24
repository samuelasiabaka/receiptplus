import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { saveReceipt, updateReceipt, getBusinessProfile, getAllInventoryItems, searchInventoryItems, getReceiptById, getReceiptUsage } from '@/lib/storage';
import { initDb } from '@/lib/database';
import type { ReceiptItem, InventoryItem, Receipt } from '@/models/types';
import { generateReceiptNumber, formatCurrency } from '@/utils/receipt';

// Animated Item Card Component
function AnimatedItemCard({
  item,
  index,
  colors,
  formatCurrency,
  onRemove,
}: {
  item: ReceiptItem;
  index: number;
  colors: any;
  formatCurrency: (amount: number) => string;
  onRemove: () => void;
}) {
  const cardAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const translateX = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const opacity = cardAnim;

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }, { scale: scaleAnim }],
      }}
    >
      <View style={[styles.itemCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
        <View style={styles.itemCardContent}>
          <Text style={[styles.itemDescription, { color: colors.text }]}>{item.description}</Text>
          <Text style={[styles.itemDetails, { color: colors.tabIconDefault }]}>
            {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRemove}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.deleteItemButton}
          activeOpacity={0.7}
        >
          <IconSymbol size={20} name="trash.fill" color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function CreateReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [editingReceiptId, setEditingReceiptId] = useState<number | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'not_paid' | 'part_paid' | undefined>(undefined);
  const [amountPaid, setAmountPaid] = useState('');
  
  // Inventory state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);

  const colors = Colors[colorScheme ?? 'light'];
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  useEffect(() => {
    loadInventory();
    loadReceiptForEdit();
  }, [params.editId]);

  useEffect(() => {
    if (inventorySearch.length >= 2) {
      searchInventory();
    } else if (inventorySearch.length === 0) {
      setFilteredInventory([]);
      setShowInventoryDropdown(false);
    } else {
      setFilteredInventory([]);
      setShowInventoryDropdown(false);
    }
  }, [inventorySearch]);

  const loadInventory = async () => {
    try {
      await initDb();
      const allItems = await getAllInventoryItems();
      setInventoryItems(allItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const searchInventory = async () => {
    try {
      const results = await searchInventoryItems(inventorySearch);
      setFilteredInventory(results);
      setShowInventoryDropdown(results.length > 0);
    } catch (error) {
      console.error('Error searching inventory:', error);
    }
  };

  const loadReceiptForEdit = async () => {
    if (params.editId) {
      try {
        const receiptId = parseInt(params.editId as string);
        if (!isNaN(receiptId)) {
          const receipt = await getReceiptById(receiptId);
          if (receipt) {
            setEditingReceiptId(receiptId);
            setItems(receipt.items || []);
            setCustomerName(receipt.customerName || '');
            setCustomerPhone(receipt.customerPhone || '');
            setNotes(receipt.notes || '');
            setPaymentStatus(receipt.paymentStatus);
            setAmountPaid(receipt.amountPaid ? receipt.amountPaid.toString() : '');
          }
        }
      } catch (error) {
        console.error('Error loading receipt for edit:', error);
      }
    }
  };

  const handleSelectInventoryItem = (item: InventoryItem) => {
    setDescription(item.name);
    setPrice(item.price.toString());
    setInventorySearch('');
    setShowInventoryDropdown(false);
    setFilteredInventory([]);
  };

  const handleAddItem = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter item description');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const newItem: ReceiptItem = {
      description: description.trim(),
      quantity: parseInt(quantity) || 1,
      price: parseFloat(price),
    };
    setItems([...items, newItem]);
    setDescription('');
    setQuantity('');
    setPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleGenerateReceipt = async () => {
    if (!customerName.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    if (!paymentStatus) {
      Alert.alert('Error', 'Please select a payment status (Paid, Not Paid, or Part Payment)');
      return;
    }

    const validItems = items.filter((item) => item.description.trim() && item.price > 0);
    
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item with description and price');
      return;
    }

    // Check receipt usage limit (for free tier)
    // Note: In Phase 3, this will check subscription status from Supabase
    try {
      const usage = await getReceiptUsage();
      if (usage.count >= usage.limit) {
        Alert.alert(
          'Monthly Limit Reached',
          `You've reached your monthly limit of ${usage.limit} receipts. Upgrade to Premium for unlimited receipts.`,
          [
            { text: 'OK', style: 'cancel' },
            // In Phase 3, add upgrade button here
          ]
        );
        return;
      }
    } catch (error) {
      // If usage tracking fails, allow creation (graceful degradation)
      console.error('Error checking usage:', error);
    }

    try {
      // Check if business profile exists
      const profile = await getBusinessProfile();
      if (!profile) {
        Alert.alert(
          'Business Profile Required',
          'Please set up your business profile first',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => {
                router.push('/business-profile');
              },
            },
          ]
        );
        return;
      }

      const receiptTotal = validItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

      // Validate amount paid if part payment is selected
      if (paymentStatus === 'part_paid') {
        if (!amountPaid || parseFloat(amountPaid) <= 0) {
          Alert.alert('Error', 'Please enter a valid amount paid for part payment');
          return;
        }
        const paidAmount = parseFloat(amountPaid);
        if (paidAmount >= receiptTotal) {
          Alert.alert('Error', 'Amount paid cannot be greater than or equal to total. Please select "Paid" instead.');
          return;
        }
      }

      if (editingReceiptId) {
        // Update existing receipt
        const existingReceipt = await getReceiptById(editingReceiptId);
        if (!existingReceipt) {
          Alert.alert('Error', 'Receipt not found');
          return;
        }

        // Calculate amount paid based on payment status
        let finalAmountPaid: number | undefined = undefined;
        if (paymentStatus === 'paid') {
          finalAmountPaid = receiptTotal;
        } else if (paymentStatus === 'part_paid' && amountPaid) {
          finalAmountPaid = parseFloat(amountPaid) || 0;
        }

        await updateReceipt(
          editingReceiptId,
          {
            receiptNumber: existingReceipt.receiptNumber, // Keep original receipt number
            total: receiptTotal,
            createdAt: existingReceipt.createdAt, // Keep original date
            items: validItems,
            paymentStatus: paymentStatus,
            amountPaid: finalAmountPaid,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          validItems
        );

        router.push(`/receipt-preview?id=${editingReceiptId}`);
      } else {
        // Calculate amount paid based on payment status
        let finalAmountPaid: number | undefined = undefined;
        if (paymentStatus === 'paid') {
          finalAmountPaid = receiptTotal;
        } else if (paymentStatus === 'part_paid' && amountPaid) {
          finalAmountPaid = parseFloat(amountPaid) || 0;
        }

        // Create new receipt
        const receiptNumber = generateReceiptNumber(profile.name);
        const receiptId = await saveReceipt(
          {
            receiptNumber,
            total: receiptTotal,
            createdAt: new Date().toISOString(),
            items: validItems,
            paymentStatus: paymentStatus,
            amountPaid: finalAmountPaid,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          validItems
        );

        // Clear form after saving
        setItems([]);
        setDescription('');
        setQuantity('');
        setPrice('');
        setCustomerName('');
        setCustomerPhone('');
        setNotes('');
        setPaymentStatus(undefined);
        setAmountPaid('');
        setInventorySearch('');
        setFilteredInventory([]);
        setShowInventoryDropdown(false);
        
        router.push(`/receipt-preview?id=${receiptId}`);
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.inputBorder, paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.background }]}>
          <IconSymbol size={20} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {editingReceiptId ? 'Edit Receipt' : 'Create Receipt'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Customer Information */}
        <View style={[styles.inputSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Information</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Customer Name *"
            placeholderTextColor={colors.tabIconDefault}
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text, marginTop: 12 }]}
            placeholder="Customer Phone (Optional)"
            placeholderTextColor={colors.tabIconDefault}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />
        </View>

        {/* Item Input Section */}
        <View style={[styles.inputSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Items</Text>
            <TouchableOpacity
              onPress={() => router.push('/inventory')}
              style={styles.inventoryLink}
            >
              <IconSymbol size={16} name="cube.box.fill" color={colors.tint} />
              <Text style={[styles.inventoryLinkText, { color: colors.tint }]}>Manage Inventory</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inventorySearchContainer}>
              <TextInput
                style={[styles.input, styles.inventorySearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Search inventory (type 2+ letters)..."
                placeholderTextColor={colors.tabIconDefault}
                value={inventorySearch}
                onChangeText={setInventorySearch}
              />
              {showInventoryDropdown && filteredInventory.length > 0 && (
                <View style={[styles.inventoryDropdown, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder }]}>
                  {filteredInventory.map((item) => (
                    <TouchableOpacity
                      key={item.id?.toString() || ''}
                      style={[styles.inventoryDropdownItem, { borderBottomColor: colors.tabIconDefault }]}
                      onPress={() => handleSelectInventoryItem(item)}
                    >
                      <View style={styles.inventoryDropdownItemContent}>
                        <Text style={[styles.inventoryDropdownItemName, { color: colors.text }]}>{item.name}</Text>
                        {item.description && (
                          <Text style={[styles.inventoryDropdownItemDesc, { color: colors.tabIconDefault }]}>{item.description}</Text>
                        )}
                      </View>
                      <Text style={[styles.inventoryDropdownItemPrice, { color: colors.tint }]}>{formatCurrency(item.price)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Item description"
              placeholderTextColor={colors.tabIconDefault}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setInventorySearch(''); // Clear inventory search when typing manually
              }}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Quantity"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              <TextInput
                style={[styles.input, styles.halfInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Rate"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                (!description.trim() || !price || parseFloat(price) <= 0) && styles.addButtonDisabled
              ]}
              onPress={handleAddItem}
              disabled={!description.trim() || !price || parseFloat(price) <= 0}
            >
              <Text style={[
                styles.addButtonText,
                (!description.trim() || !price || parseFloat(price) <= 0) && styles.addButtonTextDisabled
              ]}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items List */}
        {items.length > 0 && (
          <View style={styles.itemsList}>
            {items
              .filter((item) => item.description.trim() && item.price > 0)
              .map((item, index) => (
                <AnimatedItemCard
                  key={index}
                  item={item}
                  index={index}
                  colors={colors}
                  formatCurrency={formatCurrency}
                  onRemove={() => handleRemoveItem(index)}
                />
              ))}
          </View>
        )}

        {/* Payment Status */}
        <View style={[styles.inputSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Status</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[styles.statusButton, paymentStatus === 'paid' && styles.statusButtonActive, { borderColor: colors.inputBorder }]}
              onPress={() => {
                setPaymentStatus('paid');
                setAmountPaid(''); // Clear amount paid when switching to paid
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusButtonText, { color: paymentStatus === 'paid' ? '#FFFFFF' : colors.text }]}>Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, paymentStatus === 'not_paid' && styles.statusButtonActive, { borderColor: colors.inputBorder }]}
              onPress={() => {
                setPaymentStatus('not_paid');
                setAmountPaid(''); // Clear amount paid when switching to not paid
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusButtonText, { color: paymentStatus === 'not_paid' ? '#FFFFFF' : colors.text }]}>Not Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, paymentStatus === 'part_paid' && styles.statusButtonActive, { borderColor: colors.inputBorder }]}
              onPress={() => setPaymentStatus('part_paid')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusButtonText, { color: paymentStatus === 'part_paid' ? '#FFFFFF' : colors.text }]}>Part Payment</Text>
            </TouchableOpacity>
          </View>
          
          {/* Amount Paid Input - Show only when Part Payment is selected */}
          {paymentStatus === 'part_paid' && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8, fontSize: 14 }]}>Amount Paid</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Enter amount paid"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="decimal-pad"
                value={amountPaid}
                onChangeText={setAmountPaid}
              />
            </View>
          )}
        </View>

        {/* Notes - Temporarily Disabled */}
        {/* <View style={[styles.inputSection, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
            placeholder="Add any additional notes..."
            placeholderTextColor={colors.tabIconDefault}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View> */}

        {/* Total Summary */}
        {items.length > 0 && (
          <View style={[styles.totalSection, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Subtotal:</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal, { borderTopColor: colors.inputBorder }]}>
              <Text style={[styles.totalLabelFinal, { color: colors.text }]}>Total:</Text>
              <Text style={[styles.totalValueFinal, { color: colors.tint }]}>{formatCurrency(total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: colors.cardBackground, borderTopColor: colors.inputBorder, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!customerName.trim() || items.length === 0 || total === 0) && styles.generateButtonDisabled
          ]}
          onPress={handleGenerateReceipt}
          disabled={!customerName.trim() || items.length === 0 || total === 0}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.generateButtonText,
            (!customerName.trim() || items.length === 0 || total === 0) && styles.generateButtonTextDisabled
          ]}>
            {editingReceiptId ? 'Update Receipt' : 'Generate Receipt'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder }]}
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
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.3,
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
  inputSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  inputGroup: {
    gap: 14,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  addButtonTextDisabled: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  itemsList: {
    gap: 12,
    marginBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardContent: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
  },
  deleteItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRowFinal: {
    borderTopWidth: 1.5,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalLabelFinal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  totalValueFinal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: -0.3,
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
  generateButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  generateButtonTextDisabled: {
    color: '#FFFFFF',
    opacity: 0.7,
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
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  statusButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inventoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inventoryLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inventorySearchContainer: {
    position: 'relative',
    zIndex: 10,
  },
  inventorySearchInput: {
    marginBottom: 8,
  },
  inventoryDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  inventoryDropdownList: {
    maxHeight: 200,
  },
  inventoryDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  inventoryDropdownItemContent: {
    flex: 1,
  },
  inventoryDropdownItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  inventoryDropdownItemDesc: {
    fontSize: 12,
  },
  inventoryDropdownItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
});

