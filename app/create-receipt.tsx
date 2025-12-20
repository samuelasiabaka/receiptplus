import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { saveReceipt, updateReceipt, getBusinessProfile, getAllInventoryItems, searchInventoryItems, getReceiptById } from '@/lib/storage';
import { initDb } from '@/lib/database';
import type { ReceiptItem, InventoryItem, Receipt } from '@/models/types';
import { generateReceiptNumber, formatCurrency } from '@/utils/receipt';

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

    const validItems = items.filter((item) => item.description.trim() && item.price > 0);
    
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item with description and price');
      return;
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

      if (editingReceiptId) {
        // Update existing receipt
        const existingReceipt = await getReceiptById(editingReceiptId);
        if (!existingReceipt) {
          Alert.alert('Error', 'Receipt not found');
          return;
        }

        await updateReceipt(
          editingReceiptId,
          {
            receiptNumber: existingReceipt.receiptNumber, // Keep original receipt number
            total: receiptTotal,
            createdAt: existingReceipt.createdAt, // Keep original date
            items: validItems,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          validItems
        );

        router.push(`/receipt-preview?id=${editingReceiptId}`);
      } else {
        // Create new receipt
        const receiptNumber = generateReceiptNumber(profile.name);
        const receiptId = await saveReceipt(
          {
            receiptNumber,
            total: receiptTotal,
            createdAt: new Date().toISOString(),
            items: validItems,
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
      <View style={[styles.header, { borderBottomColor: colors.tabIconDefault, paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
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
        <View style={[styles.inputSection, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Information</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
            placeholder="Customer Name *"
            placeholderTextColor={colors.tabIconDefault}
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text, marginTop: 12 }]}
            placeholder="Customer Phone (Optional)"
            placeholderTextColor={colors.tabIconDefault}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />
        </View>

        {/* Item Input Section */}
        <View style={[styles.inputSection, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
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
                style={[styles.input, styles.inventorySearchInput, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
                placeholder="Search inventory (type 2+ letters)..."
                placeholderTextColor={colors.tabIconDefault}
                value={inventorySearch}
                onChangeText={setInventorySearch}
              />
              {showInventoryDropdown && filteredInventory.length > 0 && (
                <View style={[styles.inventoryDropdown, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
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
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
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
                style={[styles.input, styles.halfInput, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
                placeholder="Quantity"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
              <TextInput
                style={[styles.input, styles.halfInput, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, color: colors.text }]}
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
                <View key={index} style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
                  <View style={styles.itemCardContent}>
                    <Text style={[styles.itemDescription, { color: colors.text }]}>{item.description}</Text>
                    <Text style={[styles.itemDetails, { color: colors.tabIconDefault }]}>
                      {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(index)}
                    style={styles.deleteItemButton}
                  >
                    <IconSymbol size={20} name="trash.fill" color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        )}

        {/* Payment Status - Temporarily Disabled */}
        {/* <View style={[styles.inputSection, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Status</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[styles.statusButton, paymentStatus === 'paid' && styles.statusButtonActive, { borderColor: colors.tabIconDefault }]}
              onPress={() => setPaymentStatus('paid')}
            >
              <Text style={[styles.statusButtonText, { color: paymentStatus === 'paid' ? '#FFFFFF' : colors.text }]}>Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, paymentStatus === 'part_paid' && styles.statusButtonActive, { borderColor: colors.tabIconDefault }]}
              onPress={() => setPaymentStatus('part_paid')}
            >
              <Text style={[styles.statusButtonText, { color: paymentStatus === 'part_paid' ? '#FFFFFF' : colors.text }]}>Part Paid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, paymentStatus === 'not_paid' && styles.statusButtonActive, { borderColor: colors.tabIconDefault }]}
              onPress={() => setPaymentStatus('not_paid')}
            >
              <Text style={[styles.statusButtonText, { color: paymentStatus === 'not_paid' ? '#FFFFFF' : colors.text }]}>Not Paid</Text>
            </TouchableOpacity>
          </View>
        </View> */}

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
          <View style={[styles.totalSection, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Subtotal:</Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={[styles.totalLabelFinal, { color: colors.text }]}>Total:</Text>
              <Text style={[styles.totalValueFinal, { color: '#2563EB' }]}>{formatCurrency(total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.tabIconDefault, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!customerName.trim() || items.length === 0 || total === 0) && styles.generateButtonDisabled
          ]}
          onPress={handleGenerateReceipt}
          disabled={!customerName.trim() || items.length === 0 || total === 0}
        >
          <Text style={[
            styles.generateButtonText,
            (!customerName.trim() || items.length === 0 || total === 0) && styles.generateButtonTextDisabled
          ]}>
            {editingReceiptId ? 'Update Receipt' : 'Generate Receipt'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.tabIconDefault }]}
          onPress={() => router.back()}
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
  inputSection: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
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
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2563EB', // Brand Primary - Tech Blue
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  itemsList: {
    gap: 8,
    marginBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
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
    padding: 8,
  },
  totalSection: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
  },
  totalValue: {
    fontSize: 16,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  generateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2563EB', // Brand Primary - Tech Blue
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  generateButtonTextDisabled: {
    color: '#FFFFFF',
    opacity: 0.7,
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
  },
  statusButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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

